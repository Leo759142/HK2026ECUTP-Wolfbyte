import { publico } from '#server/api.ts';
import { json } from '#server/http.ts';
import { listarSectores } from '#server/repositorios/sectores.ts';

/** Sectores para elegir al registrarse (sin datos de vecinos). */
export const GET = publico(async ({ db }) => json(await listarSectores(db)));
