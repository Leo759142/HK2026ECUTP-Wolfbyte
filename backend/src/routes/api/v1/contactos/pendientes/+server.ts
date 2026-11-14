import { conSesion } from '#server/api.ts';
import { json } from '#server/http.ts';
import { misContactos } from '#server/repositorios/servicios.ts';

/** "¿Te atendió…?": contactos que aún no respondí. */
export const GET = conSesion(async ({ db, s }) => json(await misContactos(db, s.usuarioId, { pendientes: true })));
