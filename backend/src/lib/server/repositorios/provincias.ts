import type { Consulta } from '../db/index.ts';

export interface ProvinciaDto {
  id: string;
  nombre: string;
  departamento: string;
  capital: string | null;
  lat: number | null;
  lng: number | null;
  fase1: boolean;
}

export interface DistritoDto {
  id: string;
  provincia_id: string;
  nombre: string;
  lat: number | null;
  lng: number | null;
}

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

export async function listarProvincias(db: Consulta, filtro?: { fase1?: boolean }): Promise<ProvinciaDto[]> {
  const cond = filtro?.fase1 === undefined ? '' : 'WHERE fase1 = $1';
  const params = filtro?.fase1 === undefined ? [] : [filtro.fase1];
  const rows = await db.query<Record<string, unknown>>(
    `SELECT id, nombre, departamento, capital, lat, lng, fase1 FROM provincias_peru ${cond} ORDER BY fase1 DESC, nombre`,
    params
  );
  return rows.map((r) => ({
    id: String(r.id),
    nombre: String(r.nombre),
    departamento: String(r.departamento),
    capital: (r.capital as string) ?? null,
    lat: num(r.lat),
    lng: num(r.lng),
    fase1: Boolean(r.fase1),
  }));
}

export async function distritosDeProvincia(db: Consulta, provinciaId: string): Promise<DistritoDto[]> {
  const rows = await db.query<Record<string, unknown>>(
    `SELECT id, provincia_id, nombre, lat, lng FROM distritos_peru WHERE provincia_id = $1 ORDER BY nombre`,
    [provinciaId]
  );
  return rows.map((r) => ({
    id: String(r.id),
    provincia_id: String(r.provincia_id),
    nombre: String(r.nombre),
    lat: num(r.lat),
    lng: num(r.lng),
  }));
}

export async function provinciaPorPunto(db: Consulta, lat: number, lng: number): Promise<ProvinciaDto | null> {
  // Intento PostGIS (si geom/círculo disponible), luego fallback por proximidad de centroides
  const porGeom = await db.query<Record<string, unknown>>(
    `SELECT id, nombre, departamento, capital, lat, lng, fase1
       FROM provincias_peru
      WHERE (circulo_aprox IS NOT NULL AND ST_Contains(circulo_aprox, ST_SetSRID(ST_MakePoint($2, $1), 4326)))
         OR (geom IS NOT NULL AND ST_Contains(geom, ST_SetSRID(ST_MakePoint($2, $1), 4326)))
      ORDER BY fase1 DESC
      LIMIT 1`,
    [lat, lng]
  ).catch(() => [] as Record<string, unknown>[]);
  const rows = porGeom.length ? porGeom : await db.query<Record<string, unknown>>(
    `SELECT id, nombre, departamento, capital, lat, lng, fase1
       FROM provincias_peru
      WHERE lat IS NOT NULL AND lng IS NOT NULL
      ORDER BY ((lat - $1) * (lat - $1) + (lng - $2) * (lng - $2)) ASC
      LIMIT 1`,
    [lat, lng]
  );
  const r = rows[0];
  if (!r) return null;
  return {
    id: String(r.id),
    nombre: String(r.nombre),
    departamento: String(r.departamento),
    capital: (r.capital as string) ?? null,
    lat: num(r.lat),
    lng: num(r.lng),
    fase1: Boolean(r.fase1),
  };
}
