import { ok, problem, requireIdempotency } from '../../_http';
import { CATEGORIAS_FAVOR, TIPOS_FAVOR } from '../../../../dominio/tipos/tipos';
import { enmascararCoordenadas } from '../../../../dominio/tipos/geohash';
import { ServicioCierreFavor } from '../../../../dominio/favores/cierre';

export const memoria: Array<Record<string, unknown>> = [];
const seeds = [
	{ id: 'f1', zona_id: 'z1', tipo: 'prestamo_herramienta', categoria: 'prestamo_herramienta', titulo: 'Préstamo de escalera', descripcion: 'Necesito escalera de 3m por 2 días.', creador_id: 'u1', ayudante_id: null, estado: 'abierto', oculto: 0, agradecimiento: null, cerrado_en: null, lat_aprox: -12.046, lng_aprox: -77.043, creado_en: new Date().toISOString() },
	{ id: 'f2', zona_id: 'z1', tipo: 'necesidad', categoria: 'movilidad', titulo: 'Acompañamiento a cita médica', descripcion: 'Adulto mayor necesita acompañante.', creador_id: 'u4', ayudante_id: 'u2', estado: 'en_curso', oculto: 0, agradecimiento: null, cerrado_en: null, lat_aprox: -12.046, lng_aprox: -77.043, creado_en: new Date().toISOString() }
];
for (const f of seeds) if (!memoria.some((m) => m.id === f.id)) memoria.push({ ...f });

export const GET = async ({ url }) => {
	const zona = url.searchParams.get('zona_id');
	const estado = url.searchParams.get('estado');
	return ok({ items: memoria.filter((f) => (!zona || f.zona_id === zona) && (!estado || f.estado === estado)) });
};

export const POST = async ({ request }) => {
	const key = requireIdempotency(request);
	if (!(typeof key === 'string')) return key;
	const b = (await request.json().catch(() => null)) as Record<string, unknown> | null;
	if (!b?.zona_id || !b?.tipo || !b?.categoria || !b?.titulo || !b?.descripcion) return problem(422, 'Campos requeridos');
	if (!TIPOS_FAVOR.includes(String(b.tipo) as never) || !CATEGORIAS_FAVOR.includes(String(b.categoria) as never)) return problem(422, 'Tipo/categoría inválida');
	const existente = memoria.find((f) => f.id === key);
	if (existente) return ok(existente, 200, { 'Idempotent-Replayed': 'true' });
	const aprox = b.lat_aprox != null && b.lng_aprox != null ? enmascararCoordenadas(Number(b.lat_aprox), Number(b.lng_aprox)) : { lat_aprox: -12.046, lng_aprox: -77.043 };
	const item = { id: key, creador_id: 'demo', ayudante_id: null, estado: 'abierto', oculto: 0, agradecimiento: null, cerrado_en: null, creado_en: new Date().toISOString(), ...b, ...aprox };
	memoria.push(item);
	return ok(item, 201);
};

export function cerrarSiMutuo(favorId: string) {
	const favor = memoria.find((f) => f.id === favorId) as any;
	if (!favor?.ayudante_id || !favor?.creador_id) return;
	// confs se registran en ruta de confirmaciones; cierre mutuo se evalúa allí con acceso compartido en memoria global.
	void ServicioCierreFavor;
}
