-- =====================================================================
-- Base LOCAL del dispositivo (SQLite 3.38+)
-- Misma lógica que schema_postgres.sql, pero con tipos de SQLite:
-- De uuid a TEXT · timestamptz -> TEXT (Segun la ISO-8601 UTC) · boolean -> INTEGER 0/1 · jsonb -> TEXT
-- Ejecutar:  sqlite3 ayni.db < schema_sqlite.sql
-- =====================================================================
PRAGMA foreign_keys = ON;
BEGIN TRANSACTION;

-- ---------------------------------------------------------------------
-- 1. SECTORES Y MANZANAS
-- ---------------------------------------------------------------------
CREATE TABLE sectores (
  id             TEXT PRIMARY KEY,
  nombre         TEXT NOT NULL CHECK (length(trim(nombre)) BETWEEN 3 AND 80),
  area_geojson   TEXT CHECK (argit ea_geojson IS NULL OR (json_valid(area_geojson) AND json_type(area_geojson) = 'object')),
  fundador_id    TEXT,
  creado_en      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  actualizado_en TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE UNIQUE INDEX ux_sectores_nombre ON sectores (lower(nombre));

CREATE TABLE sector_manzanas (
  sector_id TEXT NOT NULL REFERENCES sectores(id) ON DELETE CASCADE,
  letra     TEXT NOT NULL CHECK (length(letra) = 1 AND letra BETWEEN 'A' AND 'J'),
  PRIMARY KEY (sector_id, letra)
);

-- ---------------------------------------------------------------------
-- 2. USUARIOS (los vecinos del sector, descargados con /sync/pull)
-- ---------------------------------------------------------------------
CREATE TABLE usuarios (
  id                       TEXT PRIMARY KEY,
  nombre                   TEXT NOT NULL CHECK (length(trim(nombre)) >= 2),
  apellido                 TEXT NOT NULL DEFAULT '',
  telefono                 TEXT UNIQUE CHECK (telefono IS NULL OR (length(telefono) = 11 AND telefono GLOB '519[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]')),  -- NULL para los vecinos: solo se guarda el propio
  sector_id                TEXT NOT NULL REFERENCES sectores(id),
  manzana                  TEXT NOT NULL,
  lat_aprox                REAL CHECK (lat_aprox BETWEEN -90 AND 90),
  lng_aprox                REAL CHECK (lng_aprox BETWEEN -180 AND 180),
  foto                     TEXT,
  distrito                 TEXT,
  direccion                TEXT,                       -- solo la del propio usuario (un Guardián la recibe en emergencia, en línea)
  referencia               TEXT,
  verificado               INTEGER NOT NULL DEFAULT 1 CHECK (verificado IN (0,1)),
  mostrar_nombre_completo  INTEGER NOT NULL DEFAULT 0 CHECK (mostrar_nombre_completo IN (0,1)),
  invitacion_guardian      TEXT CHECK (invitacion_guardian IN ('aceptada','despues','fundador')),
  idioma                   TEXT NOT NULL DEFAULT 'es' CHECK (idioma IN ('es','en','qu')),
  letra_grande             INTEGER NOT NULL DEFAULT 0 CHECK (letra_grande IN (0,1)),
  rol_plataforma           TEXT NOT NULL DEFAULT 'usuario' CHECK (rol_plataforma IN ('usuario','admin')),
  creado_en                TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  actualizado_en           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (sector_id, manzana) REFERENCES sector_manzanas(sector_id, letra),
  CHECK ((lat_aprox IS NULL) = (lng_aprox IS NULL))
);
CREATE INDEX idx_usuarios_sector ON usuarios(sector_id);

CREATE TABLE sector_guardianes (
  sector_id   TEXT NOT NULL REFERENCES sectores(id) ON DELETE CASCADE,
  usuario_id  TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  es_fundador INTEGER NOT NULL DEFAULT 0 CHECK (es_fundador IN (0,1)),
  desde       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (sector_id, usuario_id)
);
CREATE UNIQUE INDEX ux_un_fundador_por_sector ON sector_guardianes(sector_id) WHERE es_fundador = 1;

CREATE TRIGGER trg_guardian_valido BEFORE INSERT ON sector_guardianes
WHEN NOT EXISTS (SELECT 1 FROM usuarios WHERE id = NEW.usuario_id AND sector_id = NEW.sector_id)
BEGIN SELECT RAISE(ABORT, 'El Guardián debe pertenecer al sector'); END;

-- ---------------------------------------------------------------------
-- 3. SERVICIOS Y PRODUCTOS
-- ---------------------------------------------------------------------
CREATE TABLE servicios (
  id                      TEXT PRIMARY KEY,
  dueno_id                TEXT NOT NULL REFERENCES usuarios(id),
  clase                   TEXT NOT NULL DEFAULT 'servicio' CHECK (clase IN ('servicio','producto')),
  categoria               TEXT NOT NULL CHECK (categoria IN
                            ('gasfiteria','electricidad','carpinteria','cerrajeria','mascotas','clases','costura','comida','otros')),
  titulo                  TEXT NOT NULL CHECK (length(trim(titulo)) BETWEEN 3 AND 40),
  descripcion             TEXT NOT NULL CHECK (length(trim(descripcion)) BETWEEN 10 AND 200),
  horario                 TEXT NOT NULL CHECK (length(trim(horario)) >= 1),
  precio                  TEXT,
  foto                    TEXT,
  mostrar_nombre_completo INTEGER NOT NULL DEFAULT 0 CHECK (mostrar_nombre_completo IN (0,1)),
  estado                  TEXT NOT NULL DEFAULT 'disponible' CHECK (estado IN ('disponible','pausado')),
  moderacion              TEXT NOT NULL DEFAULT 'visible' CHECK (moderacion IN ('visible','en_revision','oculto')),
  eliminado_en            TEXT,
  creado_en               TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  actualizado_en          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_servicios_dueno ON servicios(dueno_id);
CREATE INDEX idx_servicios_cat ON servicios(categoria) WHERE eliminado_en IS NULL;

CREATE TABLE contactos (
  id           TEXT PRIMARY KEY,
  servicio_id  TEXT NOT NULL REFERENCES servicios(id),
  usuario_id   TEXT NOT NULL REFERENCES usuarios(id),
  respondido   INTEGER NOT NULL DEFAULT 0 CHECK (respondido IN (0,1)),
  atendido     INTEGER CHECK (atendido IN (0,1)),
  creado_en    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  CHECK ((respondido = 1 AND atendido IS NOT NULL) OR (respondido = 0 AND atendido IS NULL))
);
CREATE UNIQUE INDEX ux_contacto_abierto ON contactos(servicio_id, usuario_id) WHERE respondido = 0;
CREATE INDEX idx_contactos_usuario ON contactos(usuario_id);

CREATE TABLE recomendaciones (
  id           TEXT PRIMARY KEY,
  servicio_id  TEXT NOT NULL REFERENCES servicios(id),
  usuario_id   TEXT NOT NULL REFERENCES usuarios(id),
  comentario   TEXT NOT NULL DEFAULT '' CHECK (length(comentario) <= 200),
  creado_en    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (servicio_id, usuario_id)
);
CREATE TABLE recomendacion_etiquetas (
  recomendacion_id TEXT NOT NULL REFERENCES recomendaciones(id),
  etiqueta         TEXT NOT NULL CHECK (etiqueta IN ('puntual','precio','limpio','amable','rapido','volveria')),
  PRIMARY KEY (recomendacion_id, etiqueta)
);

CREATE TRIGGER trg_reco_no_propio BEFORE INSERT ON recomendaciones
WHEN EXISTS (SELECT 1 FROM servicios WHERE id = NEW.servicio_id AND dueno_id = NEW.usuario_id)
BEGIN SELECT RAISE(ABORT, 'No puedes recomendar tu propio servicio'); END;
CREATE TRIGGER trg_reco_atendido BEFORE INSERT ON recomendaciones
WHEN NOT EXISTS (SELECT 1 FROM contactos WHERE servicio_id = NEW.servicio_id AND usuario_id = NEW.usuario_id AND atendido = 1)
BEGIN SELECT RAISE(ABORT, 'Solo pueden dar Visto Bueno los vecinos que fueron atendidos'); END;

CREATE TRIGGER trg_reco_no_update BEFORE UPDATE ON recomendaciones
BEGIN SELECT RAISE(ABORT, 'recomendaciones es append-only'); END;
CREATE TRIGGER trg_reco_no_delete BEFORE DELETE ON recomendaciones
BEGIN SELECT RAISE(ABORT, 'recomendaciones es append-only'); END;
CREATE TRIGGER trg_etiq_no_update BEFORE UPDATE ON recomendacion_etiquetas
BEGIN SELECT RAISE(ABORT, 'recomendacion_etiquetas es append-only'); END;
CREATE TRIGGER trg_etiq_no_delete BEFORE DELETE ON recomendacion_etiquetas
BEGIN SELECT RAISE(ABORT, 'recomendacion_etiquetas es append-only'); END;

-- ---------------------------------------------------------------------
-- 4. CADENA DE FAVORES
-- ---------------------------------------------------------------------
CREATE TABLE favores (
  id               TEXT PRIMARY KEY,
  dueno_id         TEXT NOT NULL REFERENCES usuarios(id),
  tipo             TEXT NOT NULL CHECK (tipo IN ('pido','presto','regalo','intercambio')),
  titulo           TEXT NOT NULL CHECK (length(trim(titulo)) >= 3),
  detalles         TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(detalles) AND json_type(detalles) = 'object'),
  foto             TEXT,
  estado           TEXT NOT NULL DEFAULT 'disponible' CHECK (estado IN ('disponible','reservado','cerrado')),
  moderacion       TEXT NOT NULL DEFAULT 'visible' CHECK (moderacion IN ('visible','en_revision','oculto')),
  tomador_id       TEXT REFERENCES usuarios(id),
  reservado_en     TEXT,
  dueno_confirmo   INTEGER NOT NULL DEFAULT 0 CHECK (dueno_confirmo IN (0,1)),
  tomador_confirmo INTEGER NOT NULL DEFAULT 0 CHECK (tomador_confirmo IN (0,1)),
  cerrado_en       TEXT,
  eliminado_en     TEXT,
  creado_en        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  actualizado_en   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  CHECK (tomador_id IS NULL OR tomador_id <> dueno_id),
  CHECK (estado <> 'disponible' OR (tomador_id IS NULL AND reservado_en IS NULL
                                    AND dueno_confirmo = 0 AND tomador_confirmo = 0)),
  CHECK (estado <> 'reservado' OR (tomador_id IS NOT NULL AND reservado_en IS NOT NULL AND cerrado_en IS NULL)),
  CHECK (estado <> 'cerrado' OR (tomador_id IS NOT NULL AND dueno_confirmo = 1 AND tomador_confirmo = 1 AND cerrado_en IS NOT NULL))
);
CREATE INDEX idx_favores_dueno ON favores(dueno_id);
CREATE INDEX idx_favores_tomador ON favores(tomador_id) WHERE tomador_id IS NOT NULL;
CREATE INDEX idx_favores_estado ON favores(estado) WHERE eliminado_en IS NULL;

-- ---------------------------------------------------------------------
-- 5. MODERACIÓN
-- ---------------------------------------------------------------------
CREATE TABLE reportes (
  id           TEXT PRIMARY KEY,
  servicio_id  TEXT REFERENCES servicios(id),
  favor_id     TEXT REFERENCES favores(id),
  usuario_id   TEXT NOT NULL REFERENCES usuarios(id),
  motivo       TEXT NOT NULL CHECK (motivo IN ('estafa','falso','ofensivo','mala_experiencia','otro')),
  decision     TEXT CHECK (decision IN ('aprobado','ocultado')),
  resuelto_por TEXT REFERENCES usuarios(id),
  resuelto_en  TEXT,
  creado_en    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  CHECK ((servicio_id IS NOT NULL) + (favor_id IS NOT NULL) = 1),
  CHECK ((decision IS NULL) = (resuelto_por IS NULL AND resuelto_en IS NULL))
);
CREATE UNIQUE INDEX ux_reporte_servicio ON reportes(usuario_id, servicio_id) WHERE servicio_id IS NOT NULL;
CREATE UNIQUE INDEX ux_reporte_favor    ON reportes(usuario_id, favor_id)    WHERE favor_id IS NOT NULL;

CREATE TRIGGER trg_reportes_ocultar_servicio AFTER INSERT ON reportes
WHEN NEW.servicio_id IS NOT NULL
 AND (SELECT count(*) FROM reportes WHERE servicio_id = NEW.servicio_id AND decision IS NULL) >= 3
BEGIN UPDATE servicios SET moderacion = 'en_revision' WHERE id = NEW.servicio_id AND moderacion = 'visible'; END;
CREATE TRIGGER trg_reportes_ocultar_favor AFTER INSERT ON reportes
WHEN NEW.favor_id IS NOT NULL
 AND (SELECT count(*) FROM reportes WHERE favor_id = NEW.favor_id AND decision IS NULL) >= 3
BEGIN UPDATE favores SET moderacion = 'en_revision' WHERE id = NEW.favor_id AND moderacion = 'visible'; END;

-- ---------------------------------------------------------------------
-- 6. MODO EMERGENCIA
-- ---------------------------------------------------------------------
CREATE TABLE emergencias (
  id               TEXT PRIMARY KEY,
  sector_id        TEXT NOT NULL REFERENCES sectores(id),
  reportero_id     TEXT NOT NULL REFERENCES usuarios(id),
  tipo             TEXT NOT NULL CHECK (tipo IN ('inundacion','incendio','sismo','servicios','accidente','otro')),
  texto            TEXT NOT NULL DEFAULT '' CHECK (length(texto) <= 200),
  foto             TEXT,
  manzana          TEXT NOT NULL,
  estado           TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','activa','descartada','atendida')),
  confirmada_por   TEXT REFERENCES usuarios(id),
  confirmada_en    TEXT,
  motivo_descarte  TEXT,
  revisada_por     TEXT REFERENCES usuarios(id),
  revisada_en      TEXT,
  atendida_en      TEXT,
  cerrada_por      TEXT REFERENCES usuarios(id),
  vence_en         TEXT,
  reportero_visto  INTEGER NOT NULL DEFAULT 0 CHECK (reportero_visto IN (0,1)),
  creado_en        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  actualizado_en   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (sector_id, manzana) REFERENCES sector_manzanas(sector_id, letra),
  CHECK (estado NOT IN ('activa','atendida') OR (confirmada_por IS NOT NULL AND confirmada_en IS NOT NULL)),
  CHECK (estado <> 'descartada' OR (revisada_por IS NOT NULL AND revisada_en IS NOT NULL
                                     AND length(trim(coalesce(motivo_descarte,''))) > 0)),
  CHECK (estado <> 'atendida' OR (atendida_en IS NOT NULL AND cerrada_por IS NOT NULL))
);
CREATE INDEX idx_emerg_sector_estado ON emergencias(sector_id, estado);

CREATE TRIGGER trg_emerg_guardian BEFORE UPDATE OF estado ON emergencias
WHEN NEW.estado <> OLD.estado AND NEW.estado <> 'pendiente'
 AND NOT EXISTS (
   SELECT 1 FROM sector_guardianes
   WHERE sector_id = NEW.sector_id
     AND usuario_id = CASE NEW.estado WHEN 'activa' THEN NEW.confirmada_por
                                      WHEN 'descartada' THEN NEW.revisada_por
                                      WHEN 'atendida' THEN NEW.cerrada_por END)
BEGIN SELECT RAISE(ABORT, 'Solo un Guardián del sector puede cambiar el estado de la emergencia'); END;

CREATE TABLE emergencia_confirmaciones (
  emergencia_id TEXT NOT NULL REFERENCES emergencias(id) ON DELETE CASCADE,
  guardian_id   TEXT NOT NULL REFERENCES usuarios(id),
  confirmado_en TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (emergencia_id, guardian_id)
);
CREATE TRIGGER trg_emerg_conf_guardian BEFORE INSERT ON emergencia_confirmaciones
WHEN NOT EXISTS (SELECT 1 FROM emergencias e JOIN sector_guardianes g ON g.sector_id = e.sector_id AND g.usuario_id = NEW.guardian_id WHERE e.id = NEW.emergencia_id)
BEGIN SELECT RAISE(ABORT, 'Solo un Guardián del sector puede confirmar la emergencia'); END;
CREATE TRIGGER trg_emerg_conf_no_update BEFORE UPDATE ON emergencia_confirmaciones
BEGIN SELECT RAISE(ABORT, 'emergencia_confirmaciones es append-only'); END;
CREATE TRIGGER trg_emerg_conf_no_delete BEFORE DELETE ON emergencia_confirmaciones
BEGIN SELECT RAISE(ABORT, 'emergencia_confirmaciones es append-only'); END;

CREATE TABLE emergencia_acuses (
  emergencia_id  TEXT NOT NULL REFERENCES emergencias(id) ON DELETE CASCADE,
  usuario_id     TEXT NOT NULL REFERENCES usuarios(id),
  respuesta      TEXT CHECK (respuesta IN ('visto','bien','ayuda')),
  fin_visto      INTEGER NOT NULL DEFAULT 0 CHECK (fin_visto IN (0,1)),
  actualizado_en TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (emergencia_id, usuario_id)
);

CREATE TABLE pedidos_ayuda (
  id             TEXT PRIMARY KEY,
  emergencia_id  TEXT NOT NULL REFERENCES emergencias(id),
  dueno_id       TEXT NOT NULL REFERENCES usuarios(id),
  necesidad      TEXT NOT NULL CHECK (necesidad IN ('agua','comida','salud','rescate','refugio','otro')),
  cuantas        INTEGER NOT NULL DEFAULT 1 CHECK (cuantas BETWEEN 1 AND 99),
  texto          TEXT NOT NULL DEFAULT '' CHECK (length(texto) <= 200),
  foto           TEXT,
  manzana        TEXT NOT NULL,
  estado         TEXT NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto','en_camino','resuelto')),
  ayudante_id    TEXT REFERENCES usuarios(id),
  ayudante_en    TEXT,
  resuelto_en    TEXT,
  creado_en      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  actualizado_en TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  CHECK (ayudante_id IS NULL OR ayudante_id <> dueno_id),
  CHECK (estado <> 'abierto' OR ayudante_id IS NULL),
  CHECK (estado = 'abierto' OR ayudante_id IS NOT NULL OR estado = 'resuelto'),
  CHECK (estado <> 'resuelto' OR resuelto_en IS NOT NULL)
);
CREATE INDEX idx_pedidos_emergencia ON pedidos_ayuda(emergencia_id, estado);

CREATE TABLE pedido_vulnerables (
  pedido_id TEXT NOT NULL REFERENCES pedidos_ayuda(id) ON DELETE CASCADE,
  grupo     TEXT NOT NULL CHECK (grupo IN ('adulto','ninos','discapacidad','gestante','mascotas')),
  PRIMARY KEY (pedido_id, grupo)
);

CREATE TABLE grupos_apoyo (
  id             TEXT PRIMARY KEY,
  sector_id      TEXT NOT NULL REFERENCES sectores(id),
  emoji          TEXT NOT NULL DEFAULT '🤝',
  nombre         TEXT NOT NULL CHECK (length(trim(nombre)) >= 3),
  meta           TEXT NOT NULL DEFAULT '',
  recurso        TEXT CHECK (recurso IN ('agua','refugio','salud','comida','energia','traslado')),
  manzana        TEXT,
  contacto_tipo  TEXT NOT NULL CHECK (contacto_tipo IN ('tel','wa')),
  contacto_valor TEXT NOT NULL CHECK (length(contacto_valor) BETWEEN 3 AND 12 AND contacto_valor NOT GLOB '*[^0-9]*'),
  creado_en      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (sector_id, manzana) REFERENCES sector_manzanas(sector_id, letra)
);
CREATE INDEX idx_grupos_sector ON grupos_apoyo(sector_id, recurso);

-- ---------------------------------------------------------------------
-- 7. SINCRONIZACIÓN (solo local)
-- ---------------------------------------------------------------------
-- Lo que el usuario hizo sin conexión y falta enviar. Reemplaza al "status: pendiente" del prototipo.
CREATE TABLE sync_cola (
  op_id        TEXT PRIMARY KEY,                      -- UUID generado en el celular (idempotencia)
  entidad      TEXT NOT NULL CHECK (entidad IN
                 ('servicios','favores','contactos','recomendaciones','reportes','emergencias','pedidos_ayuda','emergencia_acuses')),
  operacion    TEXT NOT NULL CHECK (operacion IN ('crear','actualizar','eliminar')),
  registro_id  TEXT NOT NULL,                         -- id del servicio/favor/etc. afectado
  payload      TEXT NOT NULL CHECK (json_valid(payload)),
  estado       TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','enviando','aplicada','rechazada')),
  intentos     INTEGER NOT NULL DEFAULT 0 CHECK (intentos >= 0),
  ultimo_error TEXT,
  creado_en    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  enviado_en   TEXT
);
CREATE INDEX idx_cola_estado ON sync_cola(estado, creado_en);

CREATE TABLE sync_estado (
  clave TEXT PRIMARY KEY CHECK (clave IN ('cursor_pull','sector_id','ultimo_sync')),
  valor TEXT NOT NULL
);

-- "🕓 Pendiente de enviar" (lo que el frontend marcaba con status = 'pendiente')
CREATE VIEW v_pendientes AS
SELECT entidad, registro_id FROM sync_cola WHERE estado IN ('pendiente','enviando') AND operacion = 'crear';

-- ---------------------------------------------------------------------
-- 8. Fecha de actualización automática
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_upd_servicios AFTER UPDATE ON servicios WHEN NEW.actualizado_en = OLD.actualizado_en
BEGIN UPDATE servicios SET actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = NEW.id; END;
CREATE TRIGGER trg_upd_favores AFTER UPDATE ON favores WHEN NEW.actualizado_en = OLD.actualizado_en
BEGIN UPDATE favores SET actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = NEW.id; END;
CREATE TRIGGER trg_upd_emerg AFTER UPDATE ON emergencias WHEN NEW.actualizado_en = OLD.actualizado_en
BEGIN UPDATE emergencias SET actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = NEW.id; END;
CREATE TRIGGER trg_upd_pedidos AFTER UPDATE ON pedidos_ayuda WHEN NEW.actualizado_en = OLD.actualizado_en
BEGIN UPDATE pedidos_ayuda SET actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = NEW.id; END;

-- ---------------------------------------------------------------------
-- 9. VISTAS (lo que el frontend calculaba en JavaScript)
-- ---------------------------------------------------------------------
CREATE VIEW v_servicio_stats AS
SELECT s.id AS servicio_id, count(r.id) AS total_vistos_buenos
FROM servicios s LEFT JOIN recomendaciones r ON r.servicio_id = s.id
GROUP BY s.id;

CREATE VIEW v_servicio_etiquetas AS
SELECT r.servicio_id, e.etiqueta, count(*) AS cantidad
FROM recomendaciones r JOIN recomendacion_etiquetas e ON e.recomendacion_id = r.id
GROUP BY r.servicio_id, e.etiqueta;

CREATE VIEW v_balance_ayni AS
WITH c AS (
  SELECT CASE WHEN tipo = 'pido' THEN tomador_id ELSE dueno_id END AS da_id,
         CASE WHEN tipo = 'pido' THEN dueno_id   ELSE tomador_id END AS recibe_id
  FROM favores WHERE estado = 'cerrado' AND eliminado_en IS NULL
)
SELECT u.id AS usuario_id,
       (SELECT count(*) FROM c WHERE da_id = u.id)     AS dados,
       (SELECT count(*) FROM c WHERE recibe_id = u.id) AS recibidos
FROM usuarios u;

CREATE VIEW v_guardian_elegible AS
SELECT u.id AS usuario_id,
       CAST(julianday('now') - julianday(u.creado_en) AS INTEGER) AS dias_en_ayni,
       (julianday('now') - julianday(u.creado_en)) >= 60 AS elegible
FROM usuarios u;

CREATE VIEW v_vecino_stats AS
SELECT u.id AS usuario_id,
       ((SELECT count(*) FROM servicios s WHERE s.dueno_id = u.id AND s.eliminado_en IS NULL)
      + (SELECT count(*) FROM favores f WHERE f.dueno_id = u.id AND f.eliminado_en IS NULL)) AS publicaciones,
       (SELECT dados FROM v_balance_ayni b WHERE b.usuario_id = u.id) AS favores_dados,
       (SELECT recibidos FROM v_balance_ayni b WHERE b.usuario_id = u.id) AS favores_recibidos,
       (SELECT count(*) FROM recomendaciones r JOIN servicios s ON s.id = r.servicio_id WHERE s.dueno_id = u.id) AS vistos_buenos
FROM usuarios u;

CREATE VIEW v_emergencia_resumen AS
SELECT e.id AS emergencia_id,
       (SELECT count(*) FROM emergencia_confirmaciones c WHERE c.emergencia_id = e.id) AS confirmaciones,
       (SELECT count(*) FROM pedidos_ayuda p WHERE p.emergencia_id = e.id) AS pedidos_total,
       (SELECT count(*) FROM pedidos_ayuda p WHERE p.emergencia_id = e.id AND p.estado = 'resuelto') AS pedidos_resueltos,
       (SELECT count(*) FROM pedidos_ayuda p WHERE p.emergencia_id = e.id AND p.estado = 'abierto') AS pedidos_sin_atender,
       (SELECT count(DISTINCT p.ayudante_id) FROM pedidos_ayuda p WHERE p.emergencia_id = e.id AND p.ayudante_id IS NOT NULL) AS vecinos_ayudando,
       (SELECT count(*) FROM emergencia_acuses a WHERE a.emergencia_id = e.id AND a.respuesta = 'bien') AS a_salvo,
       (SELECT count(*) FROM emergencia_acuses a WHERE a.emergencia_id = e.id AND a.respuesta = 'ayuda') AS necesitan_ayuda,
       (SELECT count(*) FROM usuarios u WHERE u.sector_id = e.sector_id) AS vecinos_avisados
FROM emergencias e;

CREATE VIEW v_reportes_pendientes AS
SELECT coalesce(servicio_id, favor_id) AS objeto_id,
       CASE WHEN servicio_id IS NOT NULL THEN 'servicio' ELSE 'favor' END AS objeto_tipo,
       count(*) AS total_reportes,
       min(creado_en) AS primer_reporte
FROM reportes WHERE decision IS NULL
GROUP BY coalesce(servicio_id, favor_id), (servicio_id IS NOT NULL);

COMMIT;
