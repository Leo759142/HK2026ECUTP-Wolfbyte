import { bool, conSesion, enTx } from '#server/api.ts';
import { json, leerJson } from '#server/http.ts';
import { liberarReservasVencidas, listarFavores } from '#server/repositorios/favores.ts';
import * as fav from '#server/servicios/favores.ts';
import { opcion } from '#server/validar.ts';

/** Muro de favores de mi sector. Antes de responder se liberan las reservas de más de 1 hora. */
export const GET = conSesion(async ({ db, s, event }) => {
	const q = event.url.searchParams;
	await liberarReservasVencidas(db);
	const limite = Math.min(50, Math.max(1, Number(q.get('limite') ?? 20) || 20));
	const desde = Math.max(0, Number(q.get('cursor') ?? 0) || 0);
	const lista = await listarFavores(db, {
		sectorId: s.sectorId,
		yo: s.usuarioId,
		tipo: q.get('tipo') ? opcion(q.get('tipo'), 'tipo', fav.TIPOS) : null,
		estado: q.get('estado') ? opcion(q.get('estado'), 'estado', ['disponible', 'reservado', 'cerrado'] as const) : null,
		mios: bool(q.get('mios'))
	});
	return json({ items: lista.slice(desde, desde + limite), siguiente_cursor: desde + limite < lista.length ? String(desde + limite) : null });
});

export const POST = conSesion(async ({ db, s, event }) => {
	const body = await leerJson(event.request);
	const r = await enTx(db, (tx) => fav.crear(tx, s, body));
	return json(r.favor, r.creado ? 201 : 200);
});
