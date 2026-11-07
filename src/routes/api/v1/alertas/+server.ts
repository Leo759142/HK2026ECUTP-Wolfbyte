import { ok, problem, requireIdempotency } from '../../_http';
import { enmascararCoordenadas } from '../../../../dominio/tipos/geohash';

const alertas: Array<Record<string, unknown>> = [];
export const GET = async ({ url }) => ok({ items: alertas.filter((a) => !url.searchParams.get('zona_id') || a.zona_id === url.searchParams.get('zona_id')) });
export const POST = async ({ request }) => {
	const key = requireIdempotency(request);
	if (!(typeof key === 'string')) return key;
	const b = (await request.json().catch(() => null)) as Record<string, unknown> | null;
	if (!b || typeof b !== 'object' || Array.isArray(b) || !b.zona_id || !b.tipo || !b.descripcion)
		return problem(422, 'Campos requeridos', 'zona_id, tipo, descripcion, lat_aprox, lng_aprox');
	if (alertas.some((a) => a.id === key)) return ok(alertas.find((a) => a.id === key), 200, { 'Idempotent-Replayed': 'true' });
	const aprox = b.lat_aprox != null && b.lng_aprox != null ? enmascararCoordenadas(Number(b.lat_aprox), Number(b.lng_aprox)) : {};
	const item = { id: key, emergencia_id: b.emergencia_id ?? null, usuario_id: 'demo', estado: 'sin_verificar', oculto: 0, creado_en: new Date().toISOString(), actualizado_en: new Date().toISOString(), ...b, ...aprox };
	alertas.push(item);
	return ok(item, 201);
};
