-- Migración 003 · Geolocalización aproximada para emergencias y catálogo base provincias/distritos
-- Aditiva y compatible: no elimina ni renombra columnas existentes.

CREATE EXTENSION IF NOT EXISTS postgis;

-- Ubicación aproximada opcional en emergencias (privacidad: coords redondeadas en cliente/servicio)
ALTER TABLE emergencias ADD COLUMN IF NOT EXISTS provincia_id text;
ALTER TABLE emergencias ADD COLUMN IF NOT EXISTS distrito_id text;
ALTER TABLE emergencias ADD COLUMN IF NOT EXISTS lat_aprox numeric(6,3) CHECK (lat_aprox BETWEEN -90 AND 90);
ALTER TABLE emergencias ADD COLUMN IF NOT EXISTS lng_aprox numeric(7,3) CHECK (lng_aprox BETWEEN -180 AND 180);
ALTER TABLE emergencias ADD CONSTRAINT emergencias_geo_par CHECK ((lat_aprox IS NULL) = (lng_aprox IS NULL));

-- Catálogo simplificado para selector provincial (fase 1/2) y fallback offline en frontend
CREATE TABLE IF NOT EXISTS provincias_peru (
  id varchar(6) PRIMARY KEY,
  nombre varchar(100) NOT NULL,
  departamento varchar(100) NOT NULL,
  capital varchar(100),
  lat numeric(8,5),
  lng numeric(8,5),
  geom geometry(MultiPolygon, 4326),
  circulo_aprox geometry(Polygon, 4326),
  fase1 boolean NOT NULL DEFAULT false,
  creado_en timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_provincias_peru_geom ON provincias_peru USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_provincias_peru_circulo ON provincias_peru USING GIST (circulo_aprox);
CREATE INDEX IF NOT EXISTS idx_provincias_peru_fase1 ON provincias_peru (fase1);

CREATE TABLE IF NOT EXISTS distritos_peru (
  id varchar(6) PRIMARY KEY,
  provincia_id varchar(6) NOT NULL REFERENCES provincias_peru(id) ON DELETE CASCADE,
  nombre varchar(100) NOT NULL,
  lat numeric(8,5),
  lng numeric(8,5),
  geom geometry(MultiPolygon, 4326),
  centroide geometry(Point, 4326),
  creado_en timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_distritos_peru_geom ON distritos_peru USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_distritos_peru_centroide ON distritos_peru USING GIST (centroide);
CREATE INDEX IF NOT EXISTS idx_distritos_peru_provincia ON distritos_peru (provincia_id);

INSERT INTO provincias_peru (id, nombre, departamento, capital, lat, lng, fase1)
VALUES
  ('1501', 'Lima', 'Lima', 'Lima', -12.04637, -77.04279, true),
  ('0701', 'Callao', 'Callao', 'Callao', -12.05659, -77.11814, true),
  ('1502', 'Lima Provincias', 'Lima', 'Huacho', -11.85000, -76.45000, true),
  ('0401', 'Arequipa', 'Arequipa', 'Arequipa', -16.40905, -71.53745, false),
  ('0801', 'Cusco', 'Cusco', 'Cusco', -13.53195, -71.96746, false),
  ('1301', 'La Libertad (Trujillo)', 'La Libertad', 'Trujillo', -8.10905, -79.02153, false),
  ('1401', 'Lambayeque (Chiclayo)', 'Lambayeque', 'Chiclayo', -6.77137, -79.84088, false),
  ('2001', 'Piura', 'Piura', 'Piura', -5.19449, -80.63282, false),
  ('1201', 'Junín (Huancayo)', 'Junín', 'Huancayo', -12.06513, -75.20486, false),
  ('1601', 'Loreto (Iquitos)', 'Loreto', 'Iquitos', -3.74367, -73.25163, false),
  ('2101', 'Puno', 'Puno', 'Puno', -15.84022, -70.02188, false),
  ('2301', 'Tacna', 'Tacna', 'Tacna', -18.01465, -70.25362, false),
  ('0201', 'Ancash (Huaraz)', 'Ancash', 'Huaraz', -9.52779, -77.52878, false),
  ('0301', 'Apurímac (Abancay)', 'Apurímac', 'Abancay', -13.63389, -72.88139, false),
  ('0501', 'Ayacucho', 'Ayacucho', 'Ayacucho', -13.15878, -74.22321, false),
  ('0601', 'Cajamarca', 'Cajamarca', 'Cajamarca', -7.16175, -78.51278, false),
  ('0901', 'Huancavelica', 'Huancavelica', 'Huancavelica', -12.78261, -74.97266, false),
  ('1001', 'Huánuco', 'Huánuco', 'Huánuco', -9.93062, -76.24223, false),
  ('1101', 'Ica', 'Ica', 'Ica', -14.06777, -75.72861, false),
  ('1701', 'Madre de Dios', 'Madre de Dios', 'Puerto Maldonado', -12.59331, -69.18907, false),
  ('1801', 'Moquegua', 'Moquegua', 'Moquegua', -17.19300, -70.93300, false),
  ('1901', 'Pasco', 'Pasco', 'Cerro de Pasco', -10.68285, -76.25616, false),
  ('2201', 'San Martín', 'San Martín', 'Moyobamba', -6.03461, -76.97473, false),
  ('2401', 'Tumbes', 'Tumbes', 'Tumbes', -3.56694, -80.45153, false),
  ('2501', 'Ucayali', 'Ucayali', 'Pucallpa', -8.37915, -74.55387, false),
  ('0101', 'Amazonas (Chachapoyas)', 'Amazonas', 'Chachapoyas', -6.23169, -77.86903, false)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  departamento = EXCLUDED.departamento,
  capital = EXCLUDED.capital,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  fase1 = EXCLUDED.fase1;

INSERT INTO distritos_peru (id, provincia_id, nombre, lat, lng)
VALUES
  ('150101', '1501', 'Lima', -12.04637, -77.04279),
  ('150102', '1501', 'Ancón', -11.77615, -77.16972),
  ('150103', '1501', 'Ate', -12.02565, -76.91951),
  ('150108', '1501', 'Chorrillos', -12.16917, -77.02444),
  ('150122', '1501', 'Miraflores', -12.12111, -77.02972),
  ('150132', '1501', 'San Juan de Lurigancho', -11.97306, -76.99611),
  ('150140', '1501', 'Santiago de Surco', -12.14528, -76.99167),
  ('070101', '0701', 'Callao', -12.05659, -77.11814),
  ('070102', '0701', 'Bellavista', -12.05610, -77.11190),
  ('070103', '0701', 'La Punta', -12.07194, -77.16361),
  ('150201', '1502', 'Huacho', -11.10667, -77.60500),
  ('040101', '0401', 'Arequipa', -16.40905, -71.53745),
  ('080101', '0801', 'Cusco', -13.53195, -71.96746),
  ('130101', '1301', 'Trujillo', -8.10905, -79.02153),
  ('140101', '1401', 'Chiclayo', -6.77137, -79.84088),
  ('200101', '2001', 'Piura', -5.19449, -80.63282),
  ('120101', '1201', 'Huancayo', -12.06513, -75.20486),
  ('160101', '1601', 'Iquitos', -3.74367, -73.25163),
  ('210101', '2101', 'Puno', -15.84022, -70.02188),
  ('230101', '2301', 'Tacna', -18.01465, -70.25362)
ON CONFLICT (id) DO UPDATE SET
  provincia_id = EXCLUDED.provincia_id,
  nombre = EXCLUDED.nombre,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng;

-- Precalcular centroides/círculos aproximados cuando hay coords
UPDATE distritos_peru
SET centroide = ST_SetSRID(ST_MakePoint(lng::double precision, lat::double precision), 4326)
WHERE lat IS NOT NULL AND lng IS NOT NULL AND centroide IS NULL;

UPDATE provincias_peru
SET circulo_aprox = ST_Buffer(ST_SetSRID(ST_MakePoint(lng::double precision, lat::double precision), 4326)::geography, CASE WHEN fase1 THEN 50000 ELSE 25000 END)::geometry
WHERE lat IS NOT NULL AND lng IS NOT NULL AND circulo_aprox IS NULL;

-- Índices para consultas por punto aproximado en emergencias
CREATE INDEX IF NOT EXISTS idx_emergencias_provincia ON emergencias(provincia_id);
CREATE INDEX IF NOT EXISTS idx_emergencias_distrito ON emergencias(distrito_id);
