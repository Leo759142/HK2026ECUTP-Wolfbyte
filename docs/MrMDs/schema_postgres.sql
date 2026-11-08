
BEGIN;

-- ---------------------------------------------------------------------
-- 0. Funciones comunes
-- ---------------------------------------------------------------------
CREATE FUNCTION tocar_actualizado() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.actualizado_en := now();
  RETURN NEW;
END $$;

-- ---------------------------------------------------------------------
-- 1. SECTORES Y MANZANAS  (frontend: colección "sectors")
-- ---------------------------------------------------------------------
CREATE TABLE sectores (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre         text NOT NULL CHECK (length(btrim(nombre)) BETWEEN 3 AND 80),
  fundador_id    uuid,                                 -- FK se agrega tras crear usuarios
  creado_en      timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ux_sectores_nombre ON sectores (lower(nombre));

-- Manzanas A..J de cada sector (el frontend las llama "manzana" y son una letra)
CREATE TABLE sector_manzanas (
  sector_id uuid NOT NULL REFERENCES sectores(id) ON DELETE CASCADE,
  letra     char(1) NOT NULL CHECK (letra ~ '^[A-J]$'),
  PRIMARY KEY (sector_id, letra)
);

-- ---------------------------------------------------------------------
-- 2. USUARIOS  (frontend: "users")
-- ---------------------------------------------------------------------
CREATE TABLE usuarios (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre                   text NOT NULL CHECK (length(btrim(nombre)) >= 2),
  apellido                 text NOT NULL DEFAULT '',
  telefono                 text NOT NULL UNIQUE CHECK (telefono ~ '^519[0-9]{8}$'),
  sector_id                uuid NOT NULL REFERENCES sectores(id),
  manzana                  char(1) NOT NULL,
  lat_aprox                numeric(6,3) CHECK (lat_aprox BETWEEN -90 AND 90),    -- 3 decimales (~100 m)
  lng_aprox                numeric(7,3) CHECK (lng_aprox BETWEEN -180 AND 180),
  direccion_referencia     text,                       -- PRIVADA: la API nunca la devuelve
  verificado               boolean NOT NULL DEFAULT true,
  mostrar_nombre_completo  boolean NOT NULL DEFAULT false,
  invitacion_guardian      text CHECK (invitacion_guardian IN ('aceptada','despues','fundador')),
  idioma                   text NOT NULL DEFAULT 'es' CHECK (idioma IN ('es','en','qu')),
  letra_grande             boolean NOT NULL DEFAULT false,
  rol_plataforma           text NOT NULL DEFAULT 'usuario' CHECK (rol_plataforma IN ('usuario','admin')),
  creado_en                timestamptz NOT NULL DEFAULT now(),
  actualizado_en           timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (sector_id, manzana) REFERENCES sector_manzanas(sector_id, letra),
  CHECK ((lat_aprox IS NULL) = (lng_aprox IS NULL))
);
CREATE INDEX idx_usuarios_sector ON usuarios(sector_id);

ALTER TABLE sectores ADD CONSTRAINT fk_sectores_fundador
  FOREIGN KEY (fundador_id) REFERENCES usuarios(id) DEFERRABLE INITIALLY DEFERRED;

-- Guardianes del sector (frontend: sector.guardianIds)
CREATE TABLE sector_guardianes (
  sector_id   uuid NOT NULL REFERENCES sectores(id) ON DELETE CASCADE,
  usuario_id  uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  es_fundador boolean NOT NULL DEFAULT false,
  desde       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (sector_id, usuario_id)
);
CREATE UNIQUE INDEX ux_un_fundador_por_sector ON sector_guardianes(sector_id) WHERE es_fundador;

-- Un Guardián debe vivir en el sector que cuida
CREATE FUNCTION validar_guardian() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM usuarios WHERE id = NEW.usuario_id AND sector_id = NEW.sector_id) THEN
    RAISE EXCEPTION 'El Guardián debe pertenecer al sector';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_guardian_valido BEFORE INSERT ON sector_guardianes
  FOR EACH ROW EXECUTE FUNCTION validar_guardian();

-- ---------------------------------------------------------------------
-- 3. ACCESO: código SMS y sesiones (solo servidor)
-- ---------------------------------------------------------------------
CREATE TABLE otp_codigos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telefono    text NOT NULL CHECK (telefono ~ '^519[0-9]{8}$'),
  codigo_hash text NOT NULL,                           -- nunca el código en claro
  intentos    integer NOT NULL DEFAULT 0 CHECK (intentos BETWEEN 0 AND 5),
  usado       boolean NOT NULL DEFAULT false,
  expira_en   timestamptz NOT NULL,
  creado_en   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_otp_telefono ON otp_codigos(telefono, creado_en DESC);

CREATE TABLE sesiones (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id   uuid REFERENCES usuarios(id) ON DELETE CASCADE,  -- NULL = sesión de registro (aún sin cuenta)
  telefono     text NOT NULL CHECK (telefono ~ '^519[0-9]{8}$'),
  token_hash   text NOT NULL UNIQUE,                   -- se guarda solo el hash del token
  proposito    text NOT NULL DEFAULT 'sesion' CHECK (proposito IN ('sesion','registro')),
  plataforma   text NOT NULL DEFAULT 'web' CHECK (plataforma IN ('android','ios','web','otro')),
  expira_en    timestamptz NOT NULL,
  revocada     boolean NOT NULL DEFAULT false,
  creado_en    timestamptz NOT NULL DEFAULT now(),
  CHECK (proposito = 'registro' OR usuario_id IS NOT NULL)
);
CREATE INDEX idx_sesiones_usuario ON sesiones(usuario_id);

-- ---------------------------------------------------------------------
-- 4. SERVICIOS Y PRODUCTOS  (frontend: "services")
-- ---------------------------------------------------------------------
CREATE TABLE servicios (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dueno_id                uuid NOT NULL REFERENCES usuarios(id),
  clase                   text NOT NULL DEFAULT 'servicio' CHECK (clase IN ('servicio','producto')),
  categoria               text NOT NULL CHECK (categoria IN
                            ('gasfiteria','electricidad','carpinteria','cerrajeria','mascotas','clases','costura','comida','otros')),
  titulo                  text NOT NULL CHECK (length(btrim(titulo)) BETWEEN 3 AND 40),
  descripcion             text NOT NULL CHECK (length(btrim(descripcion)) BETWEEN 10 AND 200),
  horario                 text NOT NULL CHECK (length(btrim(horario)) >= 1),
  precio                  text,                        -- texto libre: "S/ 30", "S/ 20 la hora"
  foto                    text,                        -- URL o data-URL comprimida (≤ 480 px)
  mostrar_nombre_completo boolean NOT NULL DEFAULT false,
  estado                  text NOT NULL DEFAULT 'disponible' CHECK (estado IN ('disponible','pausado')),
  moderacion              text NOT NULL DEFAULT 'visible' CHECK (moderacion IN ('visible','en_revision','oculto')),
  eliminado_en            timestamptz,                 -- borrado lógico
  creado_en               timestamptz NOT NULL DEFAULT now(),
  actualizado_en          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_servicios_dueno ON servicios(dueno_id);
CREATE INDEX idx_servicios_cat ON servicios(categoria) WHERE eliminado_en IS NULL;

-- ¿Le escribió por WhatsApp? ¿Lo atendieron?  (frontend: "contacts")
CREATE TABLE contactos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  servicio_id  uuid NOT NULL REFERENCES servicios(id),
  usuario_id   uuid NOT NULL REFERENCES usuarios(id),
  respondido   boolean NOT NULL DEFAULT false,
  atendido     boolean,
  creado_en    timestamptz NOT NULL DEFAULT now(),
  CHECK ((respondido AND atendido IS NOT NULL) OR (NOT respondido AND atendido IS NULL))
);
CREATE UNIQUE INDEX ux_contacto_abierto ON contactos(servicio_id, usuario_id) WHERE NOT respondido;
CREATE INDEX idx_contactos_usuario ON contactos(usuario_id);

-- Visto Bueno  (frontend: "recommendations")  · SOLO se agregan, nunca se editan
CREATE TABLE recomendaciones (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  servicio_id  uuid NOT NULL REFERENCES servicios(id),
  usuario_id   uuid NOT NULL REFERENCES usuarios(id),
  comentario   text NOT NULL DEFAULT '' CHECK (length(comentario) <= 200),
  creado_en    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (servicio_id, usuario_id)                     -- una sola vez por servicio
);
CREATE TABLE recomendacion_etiquetas (
  recomendacion_id uuid NOT NULL REFERENCES recomendaciones(id),
  etiqueta         text NOT NULL CHECK (etiqueta IN ('puntual','precio','limpio','amable','rapido','volveria')),
  PRIMARY KEY (recomendacion_id, etiqueta)
);

CREATE FUNCTION validar_recomendacion() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM servicios WHERE id = NEW.servicio_id AND dueno_id = NEW.usuario_id) THEN
    RAISE EXCEPTION 'No puedes recomendar tu propio servicio';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM contactos
                 WHERE servicio_id = NEW.servicio_id AND usuario_id = NEW.usuario_id AND atendido) THEN
    RAISE EXCEPTION 'Solo pueden dar Visto Bueno los vecinos que fueron atendidos';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_reco_valida BEFORE INSERT ON recomendaciones
  FOR EACH ROW EXECUTE FUNCTION validar_recomendacion();

CREATE FUNCTION prohibir_modificacion() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION '% es append-only: no se permite %', TG_TABLE_NAME, TG_OP;
END $$;
CREATE TRIGGER trg_reco_append BEFORE UPDATE OR DELETE ON recomendaciones
  FOR EACH ROW EXECUTE FUNCTION prohibir_modificacion();
CREATE TRIGGER trg_etiq_append BEFORE UPDATE OR DELETE ON recomendacion_etiquetas
  FOR EACH ROW EXECUTE FUNCTION prohibir_modificacion();

-- ---------------------------------------------------------------------
-- 5. CADENA DE FAVORES  (frontend: "favors")
-- ---------------------------------------------------------------------
CREATE TABLE favores (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dueno_id         uuid NOT NULL REFERENCES usuarios(id),
  tipo             text NOT NULL CHECK (tipo IN ('pido','presto','regalo','intercambio')),
  titulo           text NOT NULL CHECK (length(btrim(titulo)) >= 3),
  detalles         jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(detalles) = 'object'),
  foto             text,
  estado           text NOT NULL DEFAULT 'disponible' CHECK (estado IN ('disponible','reservado','cerrado')),
  moderacion       text NOT NULL DEFAULT 'visible' CHECK (moderacion IN ('visible','en_revision','oculto')),
  tomador_id       uuid REFERENCES usuarios(id),
  reservado_en     timestamptz,
  dueno_confirmo   boolean NOT NULL DEFAULT false,
  tomador_confirmo boolean NOT NULL DEFAULT false,
  cerrado_en       timestamptz,
  eliminado_en     timestamptz,
  creado_en        timestamptz NOT NULL DEFAULT now(),
  actualizado_en   timestamptz NOT NULL DEFAULT now(),
  CHECK (tomador_id IS DISTINCT FROM dueno_id),
  CHECK (estado <> 'disponible' OR (tomador_id IS NULL AND reservado_en IS NULL
                                    AND NOT dueno_confirmo AND NOT tomador_confirmo)),
  CHECK (estado <> 'reservado' OR (tomador_id IS NOT NULL AND reservado_en IS NOT NULL AND cerrado_en IS NULL)),
  CHECK (estado <> 'cerrado' OR (tomador_id IS NOT NULL AND dueno_confirmo AND tomador_confirmo AND cerrado_en IS NOT NULL))
);
CREATE INDEX idx_favores_dueno ON favores(dueno_id);
CREATE INDEX idx_favores_tomador ON favores(tomador_id) WHERE tomador_id IS NOT NULL;
CREATE INDEX idx_favores_estado ON favores(estado) WHERE eliminado_en IS NULL;

-- ---------------------------------------------------------------------
-- 6. MODERACIÓN  (frontend: "reports")
-- ---------------------------------------------------------------------
CREATE TABLE reportes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  servicio_id  uuid REFERENCES servicios(id),
  favor_id     uuid REFERENCES favores(id),
  usuario_id   uuid NOT NULL REFERENCES usuarios(id),
  motivo       text NOT NULL CHECK (motivo IN ('estafa','falso','ofensivo','mala_experiencia','otro')),
  decision     text CHECK (decision IN ('aprobado','ocultado')),      -- NULL = pendiente de revisión
  resuelto_por uuid REFERENCES usuarios(id),
  resuelto_en  timestamptz,
  creado_en    timestamptz NOT NULL DEFAULT now(),
  CHECK ((servicio_id IS NOT NULL)::int + (favor_id IS NOT NULL)::int = 1),
  CHECK ((decision IS NULL) = (resuelto_por IS NULL AND resuelto_en IS NULL))
);
CREATE UNIQUE INDEX ux_reporte_servicio ON reportes(usuario_id, servicio_id) WHERE servicio_id IS NOT NULL;
CREATE UNIQUE INDEX ux_reporte_favor    ON reportes(usuario_id, favor_id)    WHERE favor_id IS NOT NULL;

-- Con 3 reportes pendientes la publicación se oculta sola (queda "en_revision")
CREATE FUNCTION ocultar_por_reportes() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.servicio_id IS NOT NULL THEN
    IF (SELECT count(*) FROM reportes WHERE servicio_id = NEW.servicio_id AND decision IS NULL) >= 3 THEN
      UPDATE servicios SET moderacion = 'en_revision' WHERE id = NEW.servicio_id AND moderacion = 'visible';
    END IF;
  ELSE
    IF (SELECT count(*) FROM reportes WHERE favor_id = NEW.favor_id AND decision IS NULL) >= 3 THEN
      UPDATE favores SET moderacion = 'en_revision' WHERE id = NEW.favor_id AND moderacion = 'visible';
    END IF;
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER trg_reportes_ocultar AFTER INSERT ON reportes
  FOR EACH ROW EXECUTE FUNCTION ocultar_por_reportes();

-- ---------------------------------------------------------------------
-- 7. MODO EMERGENCIA
-- ---------------------------------------------------------------------
-- Reporte de emergencia  (frontend: "emergencies")
CREATE TABLE emergencias (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_id        uuid NOT NULL REFERENCES sectores(id),
  reportero_id     uuid NOT NULL REFERENCES usuarios(id),
  tipo             text NOT NULL CHECK (tipo IN ('inundacion','incendio','sismo','servicios','accidente','otro')),
  texto            text NOT NULL DEFAULT '' CHECK (length(texto) <= 200),
  foto             text,
  manzana          char(1) NOT NULL,
  estado           text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','activa','descartada','atendida')),
  confirmada_por   uuid REFERENCES usuarios(id),
  confirmada_en    timestamptz,
  motivo_descarte  text,
  revisada_por     uuid REFERENCES usuarios(id),
  revisada_en      timestamptz,
  atendida_en      timestamptz,
  cerrada_por      uuid REFERENCES usuarios(id),
  reportero_visto  boolean NOT NULL DEFAULT false,
  creado_en        timestamptz NOT NULL DEFAULT now(),
  actualizado_en   timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (sector_id, manzana) REFERENCES sector_manzanas(sector_id, letra),
  CHECK (estado NOT IN ('activa','atendida') OR (confirmada_por IS NOT NULL AND confirmada_en IS NOT NULL)),
  CHECK (estado <> 'descartada' OR (revisada_por IS NOT NULL AND revisada_en IS NOT NULL
                                     AND length(btrim(coalesce(motivo_descarte,''))) > 0)),
  CHECK (estado <> 'atendida' OR (atendida_en IS NOT NULL AND cerrada_por IS NOT NULL))
);
CREATE INDEX idx_emerg_sector_estado ON emergencias(sector_id, estado);

-- Solo un Guardián del sector puede confirmar, descartar o cerrar
CREATE FUNCTION validar_guardian_emergencia() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE quien uuid;
BEGIN
  IF NEW.estado IS DISTINCT FROM OLD.estado AND NEW.estado <> 'pendiente' THEN
    quien := CASE NEW.estado WHEN 'activa'     THEN NEW.confirmada_por
                             WHEN 'descartada' THEN NEW.revisada_por
                             WHEN 'atendida'   THEN NEW.cerrada_por END;
    IF NOT EXISTS (SELECT 1 FROM sector_guardianes WHERE sector_id = NEW.sector_id AND usuario_id = quien) THEN
      RAISE EXCEPTION 'Solo un Guardián del sector puede cambiar el estado de la emergencia';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_emerg_guardian BEFORE UPDATE ON emergencias
  FOR EACH ROW EXECUTE FUNCTION validar_guardian_emergencia();

-- Respuesta de cada vecino a la alerta: visto / bien / ayuda  (frontend: emergency.acks, endSeen)
CREATE TABLE emergencia_acuses (
  emergencia_id  uuid NOT NULL REFERENCES emergencias(id) ON DELETE CASCADE,
  usuario_id     uuid NOT NULL REFERENCES usuarios(id),
  respuesta      text CHECK (respuesta IN ('visto','bien','ayuda')),
  fin_visto      boolean NOT NULL DEFAULT false,
  actualizado_en timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (emergencia_id, usuario_id)
);

-- Pedido de ayuda durante una emergencia  (frontend: "needs")
CREATE TABLE pedidos_ayuda (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emergencia_id  uuid NOT NULL REFERENCES emergencias(id),
  dueno_id       uuid NOT NULL REFERENCES usuarios(id),
  necesidad      text NOT NULL CHECK (necesidad IN ('agua','comida','salud','rescate','refugio','otro')),
  cuantas        integer NOT NULL DEFAULT 1 CHECK (cuantas BETWEEN 1 AND 99),
  texto          text NOT NULL DEFAULT '' CHECK (length(texto) <= 200),
  foto           text,
  manzana        char(1) NOT NULL,
  estado         text NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto','en_camino','resuelto')),
  ayudante_id    uuid REFERENCES usuarios(id),
  ayudante_en    timestamptz,
  resuelto_en    timestamptz,
  creado_en      timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now(),
  CHECK (ayudante_id IS DISTINCT FROM dueno_id),
  CHECK (estado <> 'abierto' OR ayudante_id IS NULL),
  CHECK (estado = 'abierto' OR ayudante_id IS NOT NULL OR estado = 'resuelto'),
  CHECK (estado <> 'resuelto' OR resuelto_en IS NOT NULL)
);
CREATE INDEX idx_pedidos_emergencia ON pedidos_ayuda(emergencia_id, estado);

CREATE TABLE pedido_vulnerables (
  pedido_id uuid NOT NULL REFERENCES pedidos_ayuda(id) ON DELETE CASCADE,
  grupo     text NOT NULL CHECK (grupo IN ('adulto','ninos','discapacidad','gestante','mascotas')),
  PRIMARY KEY (pedido_id, grupo)
);

-- Directorio de servicios y grupos de apoyo  (frontend: "groups")
CREATE TABLE grupos_apoyo (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_id      uuid NOT NULL REFERENCES sectores(id),
  emoji          text NOT NULL DEFAULT '🤝',
  nombre         text NOT NULL CHECK (length(btrim(nombre)) >= 3),
  meta           text NOT NULL DEFAULT '',
  recurso        text CHECK (recurso IN ('agua','refugio','salud','comida','energia','traslado')),
  manzana        char(1),
  contacto_tipo  text NOT NULL CHECK (contacto_tipo IN ('tel','wa')),
  contacto_valor text NOT NULL CHECK (contacto_valor ~ '^[0-9]{3,12}$'),
  creado_en      timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (sector_id, manzana) REFERENCES sector_manzanas(sector_id, letra)
);
CREATE INDEX idx_grupos_sector ON grupos_apoyo(sector_id, recurso);

-- ---------------------------------------------------------------------
-- 8. SINCRONIZACIÓN OFFLINE (solo servidor)
-- ---------------------------------------------------------------------
-- Cada operación llega con un op_id (UUID). Si ya existe aquí, es un reintento: no se repite.
CREATE TABLE sync_operaciones (
  op_id        uuid PRIMARY KEY,
  usuario_id   uuid NOT NULL REFERENCES usuarios(id),
  entidad      text NOT NULL CHECK (entidad IN
                 ('servicios','favores','contactos','recomendaciones','reportes','emergencias','pedidos_ayuda','emergencia_acuses')),
  operacion    text NOT NULL CHECK (operacion IN ('crear','actualizar','eliminar')),
  resultado    text NOT NULL CHECK (resultado IN ('aplicada','rechazada')),
  motivo       text,
  creado_local timestamptz NOT NULL,
  recibido_en  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sync_usuario ON sync_operaciones(usuario_id, recibido_en DESC);

-- ---------------------------------------------------------------------
-- 9. TRIGGERS de fecha de actualización
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_upd_sectores   BEFORE UPDATE ON sectores      FOR EACH ROW EXECUTE FUNCTION tocar_actualizado();
CREATE TRIGGER trg_upd_usuarios   BEFORE UPDATE ON usuarios      FOR EACH ROW EXECUTE FUNCTION tocar_actualizado();
CREATE TRIGGER trg_upd_servicios  BEFORE UPDATE ON servicios     FOR EACH ROW EXECUTE FUNCTION tocar_actualizado();
CREATE TRIGGER trg_upd_favores    BEFORE UPDATE ON favores       FOR EACH ROW EXECUTE FUNCTION tocar_actualizado();
CREATE TRIGGER trg_upd_emerg      BEFORE UPDATE ON emergencias   FOR EACH ROW EXECUTE FUNCTION tocar_actualizado();
CREATE TRIGGER trg_upd_pedidos    BEFORE UPDATE ON pedidos_ayuda FOR EACH ROW EXECUTE FUNCTION tocar_actualizado();

-- ---------------------------------------------------------------------
-- 10. VISTAS que el frontend calcula hoy en JavaScript
-- ---------------------------------------------------------------------
-- Vistos Buenos y etiquetas por servicio (util.statsServicio)
CREATE VIEW v_servicio_stats AS
SELECT s.id AS servicio_id,
       count(r.id)::int AS total_vistos_buenos
FROM servicios s LEFT JOIN recomendaciones r ON r.servicio_id = s.id
GROUP BY s.id;

CREATE VIEW v_servicio_etiquetas AS
SELECT r.servicio_id, e.etiqueta, count(*)::int AS cantidad
FROM recomendaciones r JOIN recomendacion_etiquetas e ON e.recomendacion_id = r.id
GROUP BY r.servicio_id, e.etiqueta;

-- Balance de Ayni (util.balanceAyni): favores cerrados dados y recibidos
CREATE VIEW v_balance_ayni AS
WITH c AS (
  SELECT CASE WHEN tipo = 'pido' THEN tomador_id ELSE dueno_id END AS da_id,
         CASE WHEN tipo = 'pido' THEN dueno_id   ELSE tomador_id END AS recibe_id
  FROM favores WHERE estado = 'cerrado' AND eliminado_en IS NULL
)
SELECT u.id AS usuario_id,
       (SELECT count(*) FROM c WHERE da_id = u.id)::int      AS dados,
       (SELECT count(*) FROM c WHERE recibe_id = u.id)::int  AS recibidos
FROM usuarios u;

-- Días en AYNI y si ya puede ser Guardián (≥ 60 días)
CREATE VIEW v_guardian_elegible AS
SELECT u.id AS usuario_id,
       (current_date - u.creado_en::date)::int AS dias_en_ayni,
       (current_date - u.creado_en::date) >= 60 AS elegible
FROM usuarios u;

-- Reportes pendientes agrupados por publicación (Panel del Guardián)
CREATE VIEW v_reportes_pendientes AS
SELECT coalesce(servicio_id, favor_id) AS objeto_id,
       CASE WHEN servicio_id IS NOT NULL THEN 'servicio' ELSE 'favor' END AS objeto_tipo,
       count(*)::int AS total_reportes,
       min(creado_en) AS primer_reporte
FROM reportes WHERE decision IS NULL
GROUP BY coalesce(servicio_id, favor_id), (servicio_id IS NOT NULL);

COMMIT;