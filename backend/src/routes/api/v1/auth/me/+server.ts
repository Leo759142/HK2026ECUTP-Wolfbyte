import { conSesion } from '#server/api.ts';
import { json } from '#server/http.ts';
import { obtenerUsuario } from '#server/repositorios/usuarios.ts';

export const GET = conSesion(async ({ db, s }) => json(await obtenerUsuario(db, s.usuarioId)));
