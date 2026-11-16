import { publico, param } from '#server/api.ts';
import { json } from '#server/http.ts';
import { distritosDeProvincia } from '#server/repositorios/provincias.ts';

export const GET = publico(async ({ db, event }) => {
  const provinciaId = param(event, 'provinciaId');
  return json(await distritosDeProvincia(db, provinciaId));
});
