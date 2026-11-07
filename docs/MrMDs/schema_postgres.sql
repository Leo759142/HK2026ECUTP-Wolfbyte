BEGIN;

CREATE TABLE schema_version (
  version     integer PRIMARY KEY,
  aplicado_en timestamptz NOT NULL DEFAULT now()
);
INSERT INTO schema_version (version) VALUES (2);

-- ---------------------------------------------------------------------
-- 1. ZONAS Y USUARIOS
-- ---------------------------------------------------------------------
CREATE TABLE zonas (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre       text NOT NULL,
  distrito     text NOT NULL,
  provincia    text NOT NULL,
  departamento text NOT NULL,
  lat_centro   numeric(6,3) NOT NULL,
  lng_centro   numeric(6,3) NOT NULL,
  creado_en    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE usuarios (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zona_id        uuid NOT NULL REFERENCES zonas(id),
  alias          text NOT NULL CHECK (char_length(alias) BETWEEN 2 AND 40),
  telefono       text UNIQUE,
  password_hash  text,
  pin_hash       text,
  rol_plataforma text NOT NULL DEFAULT 'usuario'
                 CHECK (rol_plataforma IN ('usuario','admin')),
 
  idioma         text NOT NULL DEFAULT 'es' CHECK (idioma IN ('es','qu')),
  bloqueado      boolean NOT NULL DEFAULT false,
  creado_en      timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now(),
  CHECK (password_hash IS NOT NULL OR pin_hash IS NOT NULL)
);
CREATE INDEX idx_usuarios_zona ON usuarios(zona_id);

-- ---------------------------------------------------------------------
-- 1B. GRUPOS Y COMUNIDADES + MEMBRESÍAS Y ROLES (RBAC)
-- ---------------------------------------------------------------------
CREATE TABLE grupos (
  id          uuid PRIMARY KEY,
  zona_id     uuid NOT NULL REFERENCES zonas(id),
  padre_id    uuid REFERENCES grupos(id),
  tipo        text NOT NULL CHECK (tipo IN
                ('manzana','barrio','comite_emergencia','interes')),
  nombre      text NOT NULL CHECK (char_length(nombre) BETWEEN 3 AND 60),
  reglas      text NOT NULL DEFAULT '' CHECK (char_length(reglas) <= 1000),
  creado_por  uuid NOT NULL REFERENCES usuarios(id),
  creado_en   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_grupos_zona ON grupos(zona_id, tipo);

CREATE TABLE membresias (
  grupo_id   uuid NOT NULL REFERENCES grupos(id),
  usuario_id uuid NOT NULL REFERENCES usuarios(id),
  rol        text NOT NULL CHECK (rol IN
               ('vecino','referente','emprendedor','coordinador')),
  estado     text NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa','suspendida')),
  desde      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (grupo_id, usuario_id, rol)
);
CREATE INDEX idx_membresias_usuario ON membresias(usuario_id);

CREATE VIEW v_roles_usuario AS
SELECT m.usuario_id, g.zona_id, m.grupo_id, m.rol
FROM membresias m JOIN grupos g ON g.id = m.grupo_id
WHERE m.estado = 'activa';

-- ---------------------------------------------------------------------
-- 2. SERVICIOS DE PROXIMIDAD
-- ---------------------------------------------------------------------
CREATE TABLE servicios (
  id                uuid PRIMARY KEY,           -- lo genera el cliente
  usuario_id        uuid NOT NULL REFERENCES usuarios(id),
  zona_id           uuid NOT NULL REFERENCES zonas(id),
  categoria         text NOT NULL CHECK (categoria IN (
                      'gasfiteria','carpinteria','electricidad','cerrajeria',
                      'clases','paseo_mascotas','comida','costura',
                      'reparaciones','cuidado','otro')),
  titulo            text NOT NULL CHECK (char_length(titulo) BETWEEN 3 AND 80),
  descripcion       text NOT NULL CHECK (char_length(descripcion) <= 500),
  es_emprendimiento boolean NOT NULL DEFAULT false,
  lat_aprox         numeric(6,3) NOT NULL CHECK (lat_aprox BETWEEN -90 AND 90),
  lng_aprox         numeric(6,3) NOT NULL CHECK (lng_aprox BETWEEN -180 AND 180),
  activo            boolean NOT NULL DEFAULT true,
  oculto            boolean NOT NULL DEFAULT false,
  creado_en         timestamptz NOT NULL DEFAULT now(),
  actualizado_en    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_servicios_zona_cat ON servicios(zona_id, categoria);
CREATE INDEX idx_servicios_geo      ON servicios(lat_aprox, lng_aprox);
CREATE INDEX idx_servicios_usuario  ON servicios(usuario_id);

CREATE TABLE recomendaciones_eventos (            -- APPEND-ONLY
  id               uuid PRIMARY KEY,
  servicio_id      uuid NOT NULL REFERENCES servicios(id),
  usuario_id       uuid NOT NULL REFERENCES usuarios(id),
  tipo             text NOT NULL CHECK (tipo IN ('visto_bueno','retiro')),
  comentario       text CHECK (comentario IS NULL OR char_length(comentario) <= 140),
  misma_zona       boolean NOT NULL,
  dispositivo_hash text NOT NULL,
  creado_en        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_reco_servicio ON recomendaciones_eventos(servicio_id, usuario_id, creado_en);
CREATE INDEX idx_reco_disp     ON recomendaciones_eventos(dispositivo_hash, servicio_id);

CREATE VIEW v_visto_bueno_vigente AS
SELECT DISTINCT ON (servicio_id, usuario_id)
       servicio_id, usuario_id, comentario, misma_zona, creado_en, tipo
FROM recomendaciones_eventos
ORDER BY servicio_id, usuario_id, creado_en DESC, id DESC;

CREATE VIEW v_servicio_resumen AS
SELECT s.id AS servicio_id,
       COUNT(v.usuario_id)                           AS total_vistos_buenos,
       COUNT(v.usuario_id) FILTER (WHERE v.misma_zona) AS vistos_buenos_misma_zona
FROM servicios s
LEFT JOIN v_visto_bueno_vigente v
       ON v.servicio_id = s.id AND v.tipo = 'visto_bueno'
GROUP BY s.id;

CREATE TABLE insignias (
  codigo      text PRIMARY KEY,
  nombre      text NOT NULL,
  descripcion text NOT NULL,
  umbral      integer NOT NULL
);
CREATE TABLE usuario_insignias (
  usuario_id  uuid NOT NULL REFERENCES usuarios(id),
  insignia    text NOT NULL REFERENCES insignias(codigo),
  obtenida_en timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (usuario_id, insignia)
);

-- ---------------------------------------------------------------------
-- 3. CADENA DE FAVORES
-- ---------------------------------------------------------------------
CREATE TABLE favores (
  id             uuid PRIMARY KEY,
  creador_id     uuid NOT NULL REFERENCES usuarios(id),
  ayudante_id    uuid REFERENCES usuarios(id),
  zona_id        uuid NOT NULL REFERENCES zonas(id),
  tipo           text NOT NULL CHECK (tipo IN ('oferta','necesidad')),
  categoria      text NOT NULL CHECK (categoria IN (
                   'prestamo_herramienta','ayuda_temporal','donacion',
                   'trueque_habilidad','movilidad','otro')),
  titulo         text NOT NULL CHECK (char_length(titulo) BETWEEN 3 AND 80),
  descripcion    text NOT NULL CHECK (char_length(descripcion) <= 500),
  lat_aprox      numeric(6,3) NOT NULL,
  lng_aprox      numeric(6,3) NOT NULL,
  estado         text NOT NULL DEFAULT 'abierto'
                 CHECK (estado IN ('abierto','en_curso','cerrado','cancelado')),
  agradecimiento text CHECK (agradecimiento IS NULL OR char_length(agradecimiento) <= 200),
  oculto         boolean NOT NULL DEFAULT false,
  creado_en      timestamptz NOT NULL DEFAULT now(),
  cerrado_en     timestamptz,
  CHECK (ayudante_id IS NULL OR ayudante_id <> creador_id)
);
CREATE INDEX idx_favores_zona_estado ON favores(zona_id, estado);
CREATE INDEX idx_favores_geo         ON favores(lat_aprox, lng_aprox);

CREATE TABLE favor_confirmaciones (               -- APPEND-ONLY
  id            uuid PRIMARY KEY,
  favor_id      uuid NOT NULL REFERENCES favores(id),
  usuario_id    uuid NOT NULL REFERENCES usuarios(id),
  rol_en_favor  text NOT NULL CHECK (rol_en_favor IN ('solicitante','ayudante')),
  metodo        text NOT NULL CHECK (metodo IN ('qr','boton')),
  confirmado_en timestamptz NOT NULL DEFAULT now(),
  UNIQUE (favor_id, usuario_id)
);

CREATE VIEW v_favor_listo_para_cerrar AS
SELECT favor_id
FROM favor_confirmaciones
GROUP BY favor_id
HAVING COUNT(DISTINCT rol_en_favor) = 2;

-- ---------------------------------------------------------------------
-- 4. MODO EMERGENCIA
-- ---------------------------------------------------------------------
CREATE TABLE emergencias (
  id           uuid PRIMARY KEY,
  zona_id      uuid NOT NULL REFERENCES zonas(id),
  tipo         text NOT NULL CHECK (tipo IN
                 ('lluvias_inundacion','sismo','huaico','incendio','otro')),
  titulo       text NOT NULL,
  activada_por uuid NOT NULL REFERENCES usuarios(id),
  activa       boolean NOT NULL DEFAULT true,
  inicio       timestamptz NOT NULL DEFAULT now(),
  fin          timestamptz
);
CREATE INDEX idx_emergencias_zona_activa ON emergencias(zona_id, activa);

CREATE TABLE puntos_apoyo (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zona_id    uuid NOT NULL REFERENCES zonas(id),
  tipo       text NOT NULL CHECK (tipo IN ('comando','bomberos','posta_salud',
               'refugio','punto_reunion','olla_comun','policia','otro')),
  nombre     text NOT NULL,
  telefono   text,
  lat_aprox  numeric(6,3) NOT NULL,
  lng_aprox  numeric(6,3) NOT NULL,
  verificado boolean NOT NULL DEFAULT false
);
CREATE INDEX idx_apoyo_zona ON puntos_apoyo(zona_id, tipo);

CREATE TABLE alertas (
  id             uuid PRIMARY KEY,
  emergencia_id  uuid REFERENCES emergencias(id),
  usuario_id     uuid NOT NULL REFERENCES usuarios(id),
  zona_id        uuid NOT NULL REFERENCES zonas(id),
  tipo           text NOT NULL CHECK (tipo IN ('persona_vulnerable',
                   'zona_inundada','via_bloqueada','sin_servicios_basicos',
                   'riesgo_estructural','otro')),
  descripcion    text NOT NULL CHECK (char_length(descripcion) <= 300),
  lat_aprox      numeric(6,3) NOT NULL,
  lng_aprox      numeric(6,3) NOT NULL,
  estado         text NOT NULL DEFAULT 'sin_verificar' CHECK (estado IN
                   ('sin_verificar','confirmado_vecinos','atendido','descartado')),
  oculto         boolean NOT NULL DEFAULT false,
  creado_en      timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_alertas_zona_estado ON alertas(zona_id, estado);
CREATE INDEX idx_alertas_geo         ON alertas(lat_aprox, lng_aprox);

CREATE TABLE alerta_confirmaciones (              -- APPEND-ONLY
  id            uuid PRIMARY KEY,
  alerta_id     uuid NOT NULL REFERENCES alertas(id),
  usuario_id    uuid NOT NULL REFERENCES usuarios(id),
  confirmado_en timestamptz NOT NULL DEFAULT now(),
  UNIQUE (alerta_id, usuario_id)
);

CREATE TABLE recursos_criticos (
  id            uuid PRIMARY KEY,
  emergencia_id uuid REFERENCES emergencias(id),
  usuario_id    uuid NOT NULL REFERENCES usuarios(id),
  zona_id       uuid NOT NULL REFERENCES zonas(id),
  tipo          text NOT NULL CHECK (tipo IN ('agua','gas','medicinas',
                  'refugio','generador','bote','bomba_agua','alimentos','otro')),
  modo          text NOT NULL CHECK (modo IN ('ofrece','necesita')),
  detalle       text NOT NULL CHECK (char_length(detalle) <= 200),
  lat_aprox     numeric(6,3) NOT NULL,
  lng_aprox     numeric(6,3) NOT NULL,
  disponible    boolean NOT NULL DEFAULT true,
  oculto        boolean NOT NULL DEFAULT false,
  creado_en     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_recursos_zona ON recursos_criticos(zona_id, tipo, modo);

-- ---------------------------------------------------------------------
-- 5. MODERACIÓN
-- ---------------------------------------------------------------------
CREATE TABLE reportes_moderacion (
  id            uuid PRIMARY KEY,
  reportante_id uuid NOT NULL REFERENCES usuarios(id),
  grupo_id      uuid REFERENCES grupos(id),   -- ámbito de moderación
  objeto_tipo   text NOT NULL CHECK (objeto_tipo IN
                  ('servicio','favor','alerta','recurso','usuario')),
  objeto_id     uuid NOT NULL,
  motivo        text NOT NULL CHECK (motivo IN
                  ('falso','ofensivo','spam','peligroso','datos_personales','otro')),
  detalle       text CHECK (detalle IS NULL OR char_length(detalle) <= 300),
  estado        text NOT NULL DEFAULT 'pendiente'
                CHECK (estado IN ('pendiente','ocultado','descartado')),
  resuelto_por  uuid REFERENCES usuarios(id),
  creado_en     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_reportes_estado ON reportes_moderacion(estado);

CREATE TABLE bloqueos (
  usuario_id   uuid NOT NULL REFERENCES usuarios(id),
  bloqueado_id uuid NOT NULL REFERENCES usuarios(id),
  creado_en    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (usuario_id, bloqueado_id),
  CHECK (usuario_id <> bloqueado_id)
);

-- ---------------------------------------------------------------------
-- 5B. PUBLICIDAD LOCAL (etiquetada, bloqueada durante emergencias)
-- ---------------------------------------------------------------------
CREATE TABLE anuncios (
  id            uuid PRIMARY KEY,
  anunciante_id uuid NOT NULL REFERENCES usuarios(id),
  zona_id       uuid NOT NULL REFERENCES zonas(id),
  titulo        text NOT NULL CHECK (char_length(titulo) BETWEEN 3 AND 80),
  descripcion   text NOT NULL CHECK (char_length(descripcion) <= 300),
  etiqueta      text NOT NULL DEFAULT 'publicidad' CHECK (etiqueta = 'publicidad'),
  estado        text NOT NULL DEFAULT 'pendiente'
                CHECK (estado IN ('pendiente','aprobado','rechazado','pausado')),
  aprobado_por  uuid REFERENCES usuarios(id),
  inicio        timestamptz NOT NULL DEFAULT now(),
  fin           timestamptz,
  creado_en     timestamptz NOT NULL DEFAULT now(),
  CHECK (estado <> 'aprobado' OR aprobado_por IS NOT NULL)
);
CREATE INDEX idx_anuncios_zona ON anuncios(zona_id, estado);


CREATE VIEW v_anuncios_visibles AS
SELECT a.*
FROM anuncios a
WHERE a.estado = 'aprobado'
  AND a.inicio <= now()
  AND (a.fin IS NULL OR a.fin >= now())
  AND NOT EXISTS (SELECT 1 FROM emergencias e
                  WHERE e.zona_id = a.zona_id AND e.activa);

-- ---------------------------------------------------------------------
-- 5C. REPUTACIÓN Y CONFIANZA
-- ---------------------------------------------------------------------
CREATE TABLE reputacion_eventos (                 
  id            uuid PRIMARY KEY,
  usuario_id    uuid NOT NULL REFERENCES usuarios(id),
  fuente        text NOT NULL CHECK (fuente IN ('visto_bueno_recibido',
                  'visto_bueno_retirado','favor_cerrado','reporte_confirmado',
                  'sancion','bono_emprendedor')),
  puntos        integer NOT NULL,
  referencia_id uuid,
  creado_en     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (fuente, referencia_id)
);
CREATE INDEX idx_reputacion_usuario ON reputacion_eventos(usuario_id);

CREATE VIEW v_reputacion AS
SELECT u.id AS usuario_id,
       GREATEST(0, COALESCE(SUM(r.puntos), 0))::integer AS reputacion
FROM usuarios u
LEFT JOIN reputacion_eventos r ON r.usuario_id = u.id
GROUP BY u.id;

-- ---------------------------------------------------------------------
-- 5D. INGESTA DE ALERTAS OFICIALES (el sistema propone, el coordinador confirma)
-- ---------------------------------------------------------------------
CREATE TABLE alertas_oficiales (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fuente        text NOT NULL CHECK (fuente IN
                  ('indeci','senamhi','igp','municipio','otro')),
  id_externo    text NOT NULL,
  titulo        text NOT NULL,
  detalle       text,
  nivel         text NOT NULL DEFAULT 'informativo'
                CHECK (nivel IN ('informativo','amarillo','naranja','rojo')),
  zona_id       uuid REFERENCES zonas(id),
  url_origen    text,
  payload       jsonb,
  estado        text NOT NULL DEFAULT 'propuesta'
                CHECK (estado IN ('propuesta','confirmada','descartada')),
  emergencia_id uuid REFERENCES emergencias(id),
  resuelta_por  uuid REFERENCES usuarios(id),
  recibida_en   timestamptz NOT NULL DEFAULT now(),
  resuelta_en   timestamptz,
  UNIQUE (fuente, id_externo),
  CHECK (estado = 'propuesta' OR resuelta_por IS NOT NULL),
  CHECK (estado <> 'confirmada' OR emergencia_id IS NOT NULL)
);
CREATE INDEX idx_alertas_of_estado ON alertas_oficiales(estado, nivel);

-- ---------------------------------------------------------------------
-- 5E. AUTENTICACIÓN Y NOTIFICACIONES (solo servidor)
-- Bloques "Autenticación (sesiones, PIN, dispositivos)" y "Notificaciones Push".
-- ---------------------------------------------------------------------
CREATE TABLE dispositivos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id      uuid NOT NULL REFERENCES usuarios(id),
  dispositivo_hash text NOT NULL,
  plataforma      text NOT NULL DEFAULT 'web'
                  CHECK (plataforma IN ('android','ios','web','otro')),
  confiable       boolean NOT NULL DEFAULT false,
  ultimo_uso      timestamptz NOT NULL DEFAULT now(),
  creado_en       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (usuario_id, dispositivo_hash)
);

CREATE TABLE sesiones (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id   uuid NOT NULL REFERENCES usuarios(id),
  dispositivo_id uuid NOT NULL REFERENCES dispositivos(id),
  token_hash   text NOT NULL UNIQUE,              
  metodo       text NOT NULL CHECK (metodo IN ('password','pin')),
  expira_en    timestamptz NOT NULL,
  revocada     boolean NOT NULL DEFAULT false,
  creado_en    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sesiones_usuario ON sesiones(usuario_id, revocada);

CREATE TABLE suscripciones_push (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id     uuid NOT NULL REFERENCES usuarios(id),
  dispositivo_id uuid REFERENCES dispositivos(id),
  canal          text NOT NULL CHECK (canal IN ('webpush','whatsapp')),
  endpoint       text NOT NULL,
  claves         jsonb,
  activa         boolean NOT NULL DEFAULT true,
  creado_en      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (canal, endpoint)
);

CREATE TABLE notificaciones (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zona_id       uuid NOT NULL REFERENCES zonas(id),
  grupo_id      uuid REFERENCES grupos(id),
  emergencia_id uuid REFERENCES emergencias(id),
  tipo          text NOT NULL CHECK (tipo IN
                  ('alerta_emergencia','alerta_oficial','favor','sistema')),
  titulo        text NOT NULL,
  cuerpo        text NOT NULL,
  prioridad     text NOT NULL DEFAULT 'normal' CHECK (prioridad IN ('normal','alta')),
  creada_por    uuid REFERENCES usuarios(id),
  estado        text NOT NULL DEFAULT 'pendiente'
                CHECK (estado IN ('pendiente','enviada','fallida')),
  creado_en     timestamptz NOT NULL DEFAULT now(),
  enviada_en    timestamptz
);
CREATE INDEX idx_notif_zona ON notificaciones(zona_id, creado_en DESC);

-- ---------------------------------------------------------------------
-- 6. SINCRONIZACIÓN (solo servidor): registro de operaciones ya aplicadas.
-- Si el cliente reenvía un op_id, el servidor responde "duplicada" y NO
-- vuelve a aplicarlo => idempotencia.
-- ---------------------------------------------------------------------
CREATE TABLE sync_operaciones (
  op_id       uuid PRIMARY KEY,
  usuario_id  uuid NOT NULL REFERENCES usuarios(id),
  entidad     text NOT NULL,
  operacion   text NOT NULL CHECK (operacion IN ('crear','actualizar')),
  resultado   text NOT NULL CHECK (resultado IN ('aplicada','rechazada')),
  motivo      text,
  recibido_en timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_syncop_usuario ON sync_operaciones(usuario_id, recibido_en);


CREATE TABLE sync_politicas (
  entidad    text PRIMARY KEY,
  estrategia text NOT NULL CHECK (estrategia IN
               ('append_only','ultima_escritura','primero_gana','servidor_manda')),
  nota       text
);
INSERT INTO sync_politicas (entidad, estrategia, nota) VALUES
 ('recomendaciones_eventos','append_only','Votos: solo se agregan eventos'),
 ('favor_confirmaciones','append_only','Confirmaciones: solo se agregan'),
 ('alerta_confirmaciones','append_only','Confirmaciones: solo se agregan'),
 ('reputacion_eventos','append_only','Puntos: solo se agregan eventos'),
 ('servicios','ultima_escritura','Edición del autor; gana actualizado_en más reciente'),
 ('usuarios','ultima_escritura','Solo datos de perfil'),
 ('favores','primero_gana','Aceptar: gana el primero en llegar al servidor'),
 ('alertas','servidor_manda','El estado lo fija el servidor (confirmaciones/coordinador)'),
 ('alertas_oficiales','servidor_manda','Propone el sistema, confirma el coordinador'),
 ('emergencias','servidor_manda','Solo referente/coordinador'),
 ('anuncios','servidor_manda','Aprobación por referente o admin'),
 ('membresias','servidor_manda','Roles asignados por referente/coordinador');

-- ---------------------------------------------------------------------
-- 7. TRIGGERS APPEND-ONLY
-- ---------------------------------------------------------------------
CREATE FUNCTION prohibir_modificacion() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION '% es append-only: no se permite % ', TG_TABLE_NAME, TG_OP;
END;
$$;

CREATE TRIGGER trg_reco_append_only
  BEFORE UPDATE OR DELETE ON recomendaciones_eventos
  FOR EACH ROW EXECUTE FUNCTION prohibir_modificacion();
CREATE TRIGGER trg_favconf_append_only
  BEFORE UPDATE OR DELETE ON favor_confirmaciones
  FOR EACH ROW EXECUTE FUNCTION prohibir_modificacion();
CREATE TRIGGER trg_alconf_append_only
  BEFORE UPDATE OR DELETE ON alerta_confirmaciones
  FOR EACH ROW EXECUTE FUNCTION prohibir_modificacion();

CREATE TRIGGER trg_rep_append_only
  BEFORE UPDATE OR DELETE ON reputacion_eventos
  FOR EACH ROW EXECUTE FUNCTION prohibir_modificacion();

COMMIT;
