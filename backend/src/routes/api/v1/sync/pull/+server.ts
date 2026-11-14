import { conSesion } from '#server/api.ts';
import { json } from '#server/http.ts';
import * as sync from '#server/servicios/sync.ts';

export const GET = conSesion(async ({ db, s, event }) => json(await sync.pull(db, s, event.url.searchParams.get('desde'))));
