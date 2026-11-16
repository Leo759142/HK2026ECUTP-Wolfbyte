import { publico } from '#server/api.ts';
import { json } from '#server/http.ts';
import { listarProvincias } from '#server/repositorios/provincias.ts';

export const GET = publico(async ({ db }) => json(await listarProvincias(db, { fase1: true })));
