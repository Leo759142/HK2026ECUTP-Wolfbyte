import { publico } from '#server/api.ts';
import { json } from '#server/http.ts';
import { provinciaPorPunto } from '#server/repositorios/provincias.ts';
import { coordenada } from '#server/validar.ts';

export const GET = publico(async ({ db, event }) => {
  const q = event.url.searchParams;
  const lat = coordenada(q.get('lat') === null ? null : Number(q.get('lat')), 'lat', 90);
  const lng = coordenada(q.get('lng') === null ? null : Number(q.get('lng')), 'lng', 180);
  if (lat === null || lng === null) return json(null);
  return json(await provinciaPorPunto(db, lat, lng));
});
