
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_version (
  version     INTEGER PRIMARY KEY,
  aplicado_en TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
INSERT OR IGNORE INTO schema_version (version) VALUES (2);

-- ---------------------------------------------------------------------
-- 1. ZONAS Y USUARIOS
-- ---------------------------------------------------------------------
CREATE TABLE zonas (
  id           TEXT PRIMARY KEY,
  nombre       TEXT NOT NULL,                 
  distrito     TEXT NOT NULL,
  provincia    TEXT NOT NULL,
  departamento TEXT NOT NULL,
  lat_centro   REAL NOT NULL,
  lng_centro   REAL NOT NULL,
  creado_en    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE usuarios (
  id             TEXT PRIMARY KEY,
  zona_id        TEXT NOT NULL REFERENCES zonas(id),
  alias          TEXT NOT NULL CHECK (length(alias) BETWEEN 2 AND 40),
  telefono       TEXT UNIQUE,                  
  password_hash  TEXT,
  pin_hash       TEXT,                         
  rol_plataforma TEXT NOT NULL DEFAULT 'usuario'
                 CHECK (rol_plataforma IN ('usuario','admin')),
  idioma         TEXT NOT NULL DEFAULT 'es' CHECK (idioma IN ('es','qu')),
  bloqueado      INTEGER NOT NULL DEFAULT 0 CHECK (bloqueado IN (0,1)),
  creado_en      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  actualizado_en TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  CHECK (password_hash IS NOT NULL OR pin_hash IS NOT NULL)
  
);
CREATE INDEX idx_usuarios_zona ON usuarios(zona_id);


CREATE TABLE grupos (
  id          TEXT PRIMARY KEY,
  zona_id     TEXT NOT NULL REFERENCES zonas(id),
  padre_id    TEXT REFERENCES grupos(id),        
  tipo        TEXT NOT NULL CHECK (tipo IN
                ('manzana','barrio','comite_emergencia','interes')),
  nombre      TEXT NOT NULL CHECK (length(nombre) BETWEEN 3 AND 60),
  reglas      TEXT NOT NULL DEFAULT '' CHECK (length(reglas) <= 1000),
  creado_por  TEXT NOT NULL REFERENCES usuarios(id),
  creado_en   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_grupos_zona ON grupos(zona_id, tipo);


CREATE TABLE membresias (
  grupo_id   TEXT NOT NULL REFERENCES grupos(id),
  usuario_id TEXT NOT NULL REFERENCES usuarios(id),
  rol        TEXT NOT NULL CHECK (rol IN
               ('vecino','referente','emprendedor','coordinador')),
  estado     TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa','suspendida')),
  desde      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (grupo_id, usuario_id, rol)
);
CREATE INDEX idx_membresias_usuario ON membresias(usuario_id);


CREATE VIEW v_roles_usuario AS
SELECT m.usuario_id, g.zona_id, m.grupo_id, m.rol
FROM membresias m JOIN grupos g ON g.id = m.grupo_id
WHERE m.estado = 'activa';

-- ---------------------------------------------------------------------
-- 2. MÓDULO SERVICIOS DE PROXIMIDAD (RF01, RF02, RF12)
-- ---------------------------------------------------------------------
CREATE TABLE servicios (
  id               TEXT PRIMARY KEY,
  usuario_id       TEXT NOT NULL REFERENCES usuarios(id),
  zona_id          TEXT NOT NULL REFERENCES zonas(id),
  categoria        TEXT NOT NULL CHECK (categoria IN (
                     'gasfiteria','carpinteria','electricidad','cerrajeria',
                     'clases','paseo_mascotas','comida','costura',
                     'reparaciones','cuidado','otro')),
  titulo           TEXT NOT NULL CHECK (length(titulo) BETWEEN 3 AND 80),
  descripcion      TEXT NOT NULL CHECK (length(descripcion) <= 500),
  es_emprendimiento INTEGER NOT NULL DEFAULT 0 CHECK (es_emprendimiento IN (0,1)),
  lat_aprox        REAL NOT NULL CHECK (lat_aprox BETWEEN -90 AND 90),
  lng_aprox        REAL NOT NULL CHECK (lng_aprox BETWEEN -180 AND 180),
  activo           INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0,1)),
  oculto           INTEGER NOT NULL DEFAULT 0 CHECK (oculto IN (0,1)), -- moderación
  creado_en        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  actualizado_en   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_servicios_zona_cat ON servicios(zona_id, categoria);
CREATE INDEX idx_servicios_geo      ON servicios(lat_aprox, lng_aprox);
CREATE INDEX idx_servicios_usuario  ON servicios(usuario_id);


CREATE TABLE recomendaciones_eventos (
  id               TEXT PRIMARY KEY,
  servicio_id      TEXT NOT NULL REFERENCES servicios(id),
  usuario_id       TEXT NOT NULL REFERENCES usuarios(id),
  tipo             TEXT NOT NULL CHECK (tipo IN ('visto_bueno','retiro')),
  comentario       TEXT CHECK (comentario IS NULL OR length(comentario) <= 140),
  misma_zona       INTEGER NOT NULL CHECK (misma_zona IN (0,1)), 
  dispositivo_hash TEXT NOT NULL,        
  creado_en        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_reco_servicio ON recomendaciones_eventos(servicio_id, usuario_id, creado_en);
CREATE INDEX idx_reco_disp     ON recomendaciones_eventos(dispositivo_hash, servicio_id);


CREATE VIEW v_visto_bueno_vigente AS
SELECT servicio_id, usuario_id, comentario, misma_zona, creado_en
FROM (
  SELECT r.*,
         ROW_NUMBER() OVER (PARTITION BY servicio_id, usuario_id
                            ORDER BY creado_en DESC, id DESC) AS rn
  FROM recomendaciones_eventos r
)
WHERE rn = 1 AND tipo = 'visto_bueno';

CREATE VIEW v_servicio_resumen AS
SELECT s.id AS servicio_id,
       COUNT(v.usuario_id)           AS total_vistos_buenos,
       COALESCE(SUM(v.misma_zona),0) AS vistos_buenos_misma_zona
FROM servicios s
LEFT JOIN v_visto_bueno_vigente v ON v.servicio_id = s.id
GROUP BY s.id;

CREATE TABLE insignias (
  codigo      TEXT PRIMARY KEY,           
  nombre      TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  umbral      INTEGER NOT NULL            
);
CREATE TABLE usuario_insignias (
  usuario_id    TEXT NOT NULL REFERENCES usuarios(id),
  insignia      TEXT NOT NULL REFERENCES insignias(codigo),
  obtenida_en   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (usuario_id, insignia)
);

-- ---------------------------------------------------------------------
-- 3. MÓDULO CADENA DE FAVORES (RF04, RF05)
-- ---------------------------------------------------------------------
CREATE TABLE favores (
  id             TEXT PRIMARY KEY,
  creador_id     TEXT NOT NULL REFERENCES usuarios(id),
  ayudante_id    TEXT REFERENCES usuarios(id),
  zona_id        TEXT NOT NULL REFERENCES zonas(id),
  tipo           TEXT NOT NULL CHECK (tipo IN ('oferta','necesidad')),
  categoria      TEXT NOT NULL CHECK (categoria IN (
                   'prestamo_herramienta','ayuda_temporal','donacion',
                   'trueque_habilidad','movilidad','otro')),
  titulo         TEXT NOT NULL CHECK (length(titulo) BETWEEN 3 AND 80),
  descripcion    TEXT NOT NULL CHECK (length(descripcion) <= 500),
  lat_aprox      REAL NOT NULL,
  lng_aprox      REAL NOT NULL,
  estado         TEXT NOT NULL DEFAULT 'abierto'
                 CHECK (estado IN ('abierto','en_curso','cerrado','cancelado')),
  agradecimiento TEXT CHECK (agradecimiento IS NULL OR length(agradecimiento) <= 200),
  oculto         INTEGER NOT NULL DEFAULT 0 CHECK (oculto IN (0,1)),
  creado_en      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  cerrado_en     TEXT,
  CHECK (ayudante_id IS NULL OR ayudante_id <> creador_id)
);
CREATE INDEX idx_favores_zona_estado ON favores(zona_id, estado);
CREATE INDEX idx_favores_geo         ON favores(lat_aprox, lng_aprox);


CREATE TABLE favor_confirmaciones (
  id            TEXT PRIMARY KEY,
  favor_id      TEXT NOT NULL REFERENCES favores(id),
  usuario_id    TEXT NOT NULL REFERENCES usuarios(id),
  rol_en_favor  TEXT NOT NULL CHECK (rol_en_favor IN ('solicitante','ayudante')),
  metodo        TEXT NOT NULL CHECK (metodo IN ('qr','boton')),
  confirmado_en TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (favor_id, usuario_id)
);


CREATE VIEW v_favor_listo_para_cerrar AS
SELECT favor_id
FROM favor_confirmaciones
GROUP BY favor_id
HAVING COUNT(DISTINCT rol_en_favor) = 2;

-- ---------------------------------------------------------------------
-- 4. MODO EMERGENCIA (RF07, RF08)
-- ---------------------------------------------------------------------
CREATE TABLE emergencias (
  id            TEXT PRIMARY KEY,
  zona_id       TEXT NOT NULL REFERENCES zonas(id),
  tipo          TEXT NOT NULL CHECK (tipo IN
                  ('lluvias_inundacion','sismo','huaico','incendio','otro')),
  titulo        TEXT NOT NULL,
  activada_por  TEXT NOT NULL REFERENCES usuarios(id),   
  activa        INTEGER NOT NULL DEFAULT 1 CHECK (activa IN (0,1)),
  inicio        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  fin           TEXT
);
CREATE INDEX idx_emergencias_zona_activa ON emergencias(zona_id, activa);


CREATE TABLE puntos_apoyo (
  id         TEXT PRIMARY KEY,
  zona_id    TEXT NOT NULL REFERENCES zonas(id),
  tipo       TEXT NOT NULL CHECK (tipo IN ('comando','bomberos','posta_salud',
               'refugio','punto_reunion','olla_comun','policia','otro')),
  nombre     TEXT NOT NULL,
  telefono   TEXT,
  lat_aprox  REAL NOT NULL,
  lng_aprox  REAL NOT NULL,
  verificado INTEGER NOT NULL DEFAULT 0 CHECK (verificado IN (0,1))
);
CREATE INDEX idx_apoyo_zona ON puntos_apoyo(zona_id, tipo);


CREATE TABLE alertas (
  id              TEXT PRIMARY KEY,
  emergencia_id   TEXT REFERENCES emergencias(id),
  usuario_id      TEXT NOT NULL REFERENCES usuarios(id),
  zona_id         TEXT NOT NULL REFERENCES zonas(id),
  tipo            TEXT NOT NULL CHECK (tipo IN ('persona_vulnerable',
                    'zona_inundada','via_bloqueada','sin_servicios_basicos',
                    'riesgo_estructural','otro')),
  descripcion     TEXT NOT NULL CHECK (length(descripcion) <= 300),
  lat_aprox       REAL NOT NULL,
  lng_aprox       REAL NOT NULL,
  estado          TEXT NOT NULL DEFAULT 'sin_verificar' CHECK (estado IN
                    ('sin_verificar','confirmado_vecinos','atendido','descartado')),
  oculto          INTEGER NOT NULL DEFAULT 0 CHECK (oculto IN (0,1)),
  creado_en       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  actualizado_en  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_alertas_zona_estado ON alertas(zona_id, estado);
CREATE INDEX idx_alertas_geo         ON alertas(lat_aprox, lng_aprox);


CREATE TABLE alerta_confirmaciones (
  id            TEXT PRIMARY KEY,
  alerta_id     TEXT NOT NULL REFERENCES alertas(id),
  usuario_id    TEXT NOT NULL REFERENCES usuarios(id),
  confirmado_en TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (alerta_id, usuario_id)
);


CREATE TABLE recursos_criticos (
  id            TEXT PRIMARY KEY,
  emergencia_id TEXT REFERENCES emergencias(id),
  usuario_id    TEXT NOT NULL REFERENCES usuarios(id),
  zona_id       TEXT NOT NULL REFERENCES zonas(id),
  tipo          TEXT NOT NULL CHECK (tipo IN ('agua','gas','medicinas',
                  'refugio','generador','bote','bomba_agua','alimentos','otro')),
  modo          TEXT NOT NULL CHECK (modo IN ('ofrece','necesita')),
  detalle       TEXT NOT NULL CHECK (length(detalle) <= 200),
  lat_aprox     REAL NOT NULL,
  lng_aprox     REAL NOT NULL,
  disponible    INTEGER NOT NULL DEFAULT 1 CHECK (disponible IN (0,1)),
  oculto        INTEGER NOT NULL DEFAULT 0 CHECK (oculto IN (0,1)),
  creado_en     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_recursos_zona ON recursos_criticos(zona_id, tipo, modo);

-- ---------------------------------------------------------------------
-- 5. MODERACIÓN (RF11)
-- ---------------------------------------------------------------------
CREATE TABLE reportes_moderacion (
  id            TEXT PRIMARY KEY,
  reportante_id TEXT NOT NULL REFERENCES usuarios(id),
  grupo_id      TEXT REFERENCES grupos(id),   
  objeto_tipo   TEXT NOT NULL CHECK (objeto_tipo IN
                  ('servicio','favor','alerta','recurso','usuario')),
  objeto_id     TEXT NOT NULL,
  motivo        TEXT NOT NULL CHECK (motivo IN
                  ('falso','ofensivo','spam','peligroso','datos_personales','otro')),
  detalle       TEXT CHECK (detalle IS NULL OR length(detalle) <= 300),
  estado        TEXT NOT NULL DEFAULT 'pendiente'
                CHECK (estado IN ('pendiente','ocultado','descartado')),
  resuelto_por  TEXT REFERENCES usuarios(id),
  creado_en     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_reportes_estado ON reportes_moderacion(estado);

CREATE TABLE bloqueos (
  usuario_id   TEXT NOT NULL REFERENCES usuarios(id),
  bloqueado_id TEXT NOT NULL REFERENCES usuarios(id),
  creado_en    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (usuario_id, bloqueado_id),
  CHECK (usuario_id <> bloqueado_id)
);

-- ---------------------------------------------------------------------
-- 5B. PUBLICIDAD LOCAL (etiquetada, bloqueada durante emergencias)
-- ---------------------------------------------------------------------
CREATE TABLE anuncios (
  id            TEXT PRIMARY KEY,
  anunciante_id TEXT NOT NULL REFERENCES usuarios(id),
  zona_id       TEXT NOT NULL REFERENCES zonas(id),
  titulo        TEXT NOT NULL CHECK (length(titulo) BETWEEN 3 AND 80),
  descripcion   TEXT NOT NULL CHECK (length(descripcion) <= 300),
  etiqueta      TEXT NOT NULL DEFAULT 'publicidad' CHECK (etiqueta = 'publicidad'),
  estado        TEXT NOT NULL DEFAULT 'pendiente'
                CHECK (estado IN ('pendiente','aprobado','rechazado','pausado')),
  aprobado_por  TEXT REFERENCES usuarios(id),
  inicio        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  fin           TEXT,
  creado_en     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  CHECK (estado <> 'aprobado' OR aprobado_por IS NOT NULL)
);
CREATE INDEX idx_anuncios_zona ON anuncios(zona_id, estado);


CREATE VIEW v_anuncios_visibles AS
SELECT a.*
FROM anuncios a
WHERE a.estado = 'aprobado'
  AND a.inicio <= strftime('%Y-%m-%dT%H:%M:%fZ','now')
  AND (a.fin IS NULL OR a.fin >= strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  AND NOT EXISTS (SELECT 1 FROM emergencias e
                  WHERE e.zona_id = a.zona_id AND e.activa = 1);

-- ---------------------------------------------------------------------
-- 5C. REPUTACIÓN Y CONFIANZA (alimentada por Visto Bueno y Favores)
-- ---------------------------------------------------------------------
CREATE TABLE reputacion_eventos (                 
  id            TEXT PRIMARY KEY,
  usuario_id    TEXT NOT NULL REFERENCES usuarios(id),
  fuente        TEXT NOT NULL CHECK (fuente IN ('visto_bueno_recibido',
                  'visto_bueno_retirado','favor_cerrado','reporte_confirmado',
                  'sancion','bono_emprendedor')),
  puntos        INTEGER NOT NULL,
  referencia_id TEXT,                              
  creado_en     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (fuente, referencia_id)
);
CREATE INDEX idx_reputacion_usuario ON reputacion_eventos(usuario_id);

CREATE VIEW v_reputacion AS
SELECT u.id AS usuario_id, MAX(0, COALESCE(SUM(r.puntos), 0)) AS reputacion
FROM usuarios u
LEFT JOIN reputacion_eventos r ON r.usuario_id = u.id
GROUP BY u.id;

-- ---------------------------------------------------------------------
-- 5D. INGESTA DE ALERTAS OFICIALES (INDECI, SENAMHI, IGP, municipio)
-- El sistema PROPONE; el coordinador CONFIRMA y recién ahí nace la emergencia.
-- ---------------------------------------------------------------------
CREATE TABLE alertas_oficiales (
  id            TEXT PRIMARY KEY,
  fuente        TEXT NOT NULL CHECK (fuente IN
                  ('indeci','senamhi','igp','municipio','otro')),
  id_externo    TEXT NOT NULL,                     
  titulo        TEXT NOT NULL,
  detalle       TEXT,
  nivel         TEXT NOT NULL DEFAULT 'informativo'
                CHECK (nivel IN ('informativo','amarillo','naranja','rojo')),
  zona_id       TEXT REFERENCES zonas(id),
  url_origen    TEXT,
  payload       TEXT,                              
  estado        TEXT NOT NULL DEFAULT 'propuesta'
                CHECK (estado IN ('propuesta','confirmada','descartada')),
  emergencia_id TEXT REFERENCES emergencias(id),
  resuelta_por  TEXT REFERENCES usuarios(id),
  recibida_en   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  resuelta_en   TEXT,
  UNIQUE (fuente, id_externo),                     
  CHECK (estado = 'propuesta' OR resuelta_por IS NOT NULL),
  CHECK (estado <> 'confirmada' OR emergencia_id IS NOT NULL)
);
CREATE INDEX idx_alertas_of_estado ON alertas_oficiales(estado, nivel);

-- ---------------------------------------------------------------------
-- 6. SINCRONIZACIÓN (solo local): cola de salida (outbox)
-- Cada escritura offline guarda aquí una operación con su propio op_id.
-- El servidor ignora op_id repetidos => reintentos seguros (idempotencia).
-- ---------------------------------------------------------------------
CREATE TABLE sync_cola (
  op_id       TEXT PRIMARY KEY,             
  entidad     TEXT NOT NULL,                
  operacion   TEXT NOT NULL CHECK (operacion IN ('crear','actualizar')),
  payload     TEXT NOT NULL,                
  estado      TEXT NOT NULL DEFAULT 'pendiente'
              CHECK (estado IN ('pendiente','enviando','aplicada','rechazada')),
  intentos    INTEGER NOT NULL DEFAULT 0,
  error       TEXT,
  creado_en   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_sync_estado ON sync_cola(estado, creado_en);

CREATE TABLE sync_estado (                 
  clave TEXT PRIMARY KEY,                  
  valor TEXT NOT NULL
);

CREATE TABLE sync_politicas (
  entidad    TEXT PRIMARY KEY,
  estrategia TEXT NOT NULL CHECK (estrategia IN
               ('append_only','ultima_escritura','primero_gana','servidor_manda')),
  nota       TEXT
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
CREATE TRIGGER trg_reco_no_update BEFORE UPDATE ON recomendaciones_eventos
BEGIN SELECT RAISE(ABORT, 'recomendaciones_eventos es append-only'); END;
CREATE TRIGGER trg_reco_no_delete BEFORE DELETE ON recomendaciones_eventos
BEGIN SELECT RAISE(ABORT, 'recomendaciones_eventos es append-only'); END;

CREATE TRIGGER trg_favconf_no_update BEFORE UPDATE ON favor_confirmaciones
BEGIN SELECT RAISE(ABORT, 'favor_confirmaciones es append-only'); END;
CREATE TRIGGER trg_favconf_no_delete BEFORE DELETE ON favor_confirmaciones
BEGIN SELECT RAISE(ABORT, 'favor_confirmaciones es append-only'); END;

CREATE TRIGGER trg_alconf_no_update BEFORE UPDATE ON alerta_confirmaciones
BEGIN SELECT RAISE(ABORT, 'alerta_confirmaciones es append-only'); END;
CREATE TRIGGER trg_alconf_no_delete BEFORE DELETE ON alerta_confirmaciones
BEGIN SELECT RAISE(ABORT, 'alerta_confirmaciones es append-only'); END;

CREATE TRIGGER trg_rep_no_update BEFORE UPDATE ON reputacion_eventos
BEGIN SELECT RAISE(ABORT, 'reputacion_eventos es append-only'); END;
CREATE TRIGGER trg_rep_no_delete BEFORE DELETE ON reputacion_eventos
BEGIN SELECT RAISE(ABORT, 'reputacion_eventos es append-only'); END;
