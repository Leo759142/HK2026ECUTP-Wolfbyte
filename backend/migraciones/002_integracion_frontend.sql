-- Migración 002 · Ajustes para integrar el frontend ayni-app con la base.
-- Solo AGREGA columnas, triggers y valores permitidos: no borra ni renombra nada de la 001.
-- Decisiones documentadas en docs/INTEGRACION.md.

-- 1. Conteos de Visto Bueno anteriores a AYNI (el frontend los llama baseVistos / baseTags).
--    Sirven para datos de demostración o historiales importados; el total visible es
--    vistos_base + count(recomendaciones), igual que util.statsServicio del frontend.
ALTER TABLE servicios ADD COLUMN vistos_base integer NOT NULL DEFAULT 0 CHECK (vistos_base >= 0);
ALTER TABLE servicios ADD COLUMN etiquetas_base jsonb NOT NULL DEFAULT '{}'::jsonb
  CHECK (jsonb_typeof(etiquetas_base) = 'object');

-- 2. "¿Te atendió?" cambia un contacto existente: hace falta saber cuándo, para /sync/pull.
ALTER TABLE contactos ADD COLUMN actualizado_en timestamptz NOT NULL DEFAULT now();
CREATE TRIGGER trg_upd_contactos BEFORE UPDATE ON contactos FOR EACH ROW EXECUTE FUNCTION tocar_actualizado();

-- 3. Respuestas a la alerta: la 001 tiene la columna pero no el trigger que la mantiene.
CREATE TRIGGER trg_upd_acuses BEFORE UPDATE ON emergencia_acuses FOR EACH ROW EXECUTE FUNCTION tocar_actualizado();

-- 4. Nuevo Guardián (o Guardián que deja de serlo) = el sector cambió, para /sync/pull.
CREATE FUNCTION tocar_sector_por_guardian() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE sectores SET actualizado_en = now() WHERE id = COALESCE(NEW.sector_id, OLD.sector_id);
  RETURN NULL;
END $$;
CREATE TRIGGER trg_guardian_toca_sector AFTER INSERT OR DELETE ON sector_guardianes
  FOR EACH ROW EXECUTE FUNCTION tocar_sector_por_guardian();

-- 5. La cola offline también lleva ajustes del perfil (usuarios) y decisiones de moderación del Guardián.
ALTER TABLE sync_operaciones DROP CONSTRAINT sync_operaciones_entidad_check;
ALTER TABLE sync_operaciones ADD CONSTRAINT sync_operaciones_entidad_check CHECK (entidad IN
  ('servicios','favores','contactos','recomendaciones','reportes','emergencias','pedidos_ayuda',
   'emergencia_acuses','usuarios','moderacion'));
-- Código de error para repetir la misma respuesta si el cliente reintenta una operación rechazada.
ALTER TABLE sync_operaciones ADD COLUMN codigo text;

-- 6. Búsquedas frecuentes.
CREATE INDEX idx_otp_vigente ON otp_codigos(telefono, expira_en) WHERE NOT usado;
CREATE INDEX idx_sesiones_vigentes ON sesiones(token_hash) WHERE NOT revocada;
CREATE INDEX idx_reportes_pendientes ON reportes(servicio_id, favor_id) WHERE decision IS NULL;
