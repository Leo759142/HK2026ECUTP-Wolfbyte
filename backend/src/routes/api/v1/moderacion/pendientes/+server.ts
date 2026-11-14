import { conSesion } from '#server/api.ts';
import { json } from '#server/http.ts';
import * as fav from '#server/servicios/favores.ts';

export const GET = conSesion(async ({ db, s }) => json(await fav.pendientes(db, s)));
