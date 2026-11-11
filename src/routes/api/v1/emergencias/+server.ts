import type { RequestHandler } from './$types';
import { ok, problem, requireIdempotency } from '../../_http';
import { errorTextos, esRespuesta, leerObjeto, validarFoto } from '../../_validar';
import { TIPOS_DESASTRES, MAPEO_DESASTRES_ALERTA } from '../../dominio/tipos/tipos';
import { store } from '../../_store';

// Helpers para manipular emergencias (usando el store disponible)
function listarEntidad(entidad: keyof typeof store, filtro?: (e: any) => boolean): any[] {
	return Object.values(store)[0]?.filter(filtro) || [];
}

function crearEntidad(entidad: keyof typeof store, dato: any): any {
	// Implementación básica usando el store
	const existing = store[entidad] || [];
	const nuevo = { id: crypto.randomUUID(), ...dato, creado_en: new Date().toISOString(), actualizado_en: new Date().toISOString() };
	store[entidad] = [...existing, nuevo];
	return nuevo;
}

function aplicarEntidadLWW(entidad: keyof typeof store, dato: any): any {
	const existing = listarEntidad(entidad, (e) => e.id === dato.id);
	if (existing.length > 0) {
		return crearEntidad(entidad, { ...existing[0], ...dato, actualizado_en: new Date().toISOString() });
	}
	return crearEntidad(entidad, dato);
}

function obtenerEntidad(entidad: keyof typeof store, id: string): any {
	return listarEntidad(entidad, (e) => e.id === id).at(0);
}

// Tipos de emergencia mapeando dominio y UI
function obtenerTipoValidado(tipo: string): string | undefined {
	if (TIPOS_DESASTRES.includes(tipo as any)) return tipo;
	if (MAPEO_DESASTRES_ALERTA[tipo]) return MAPEO_DESASTRES_ALERTA[tipo];
	return undefined;
}

const ROLES_EMERGENCIA = ['coordinador', 'admin', 'referente'];

function sesionDe(cookies: any): { usuarioId: string; rol: string } | null {
	const raw = cookies.get('pod_sesion');
	if (!raw) return null;
	try {
		const p = JSON.parse(decodeURIComponent(raw)) as { usuarioId: string; rol: string; exp: number };
		if (p.exp && Date.now() > p.exp) return null;
		return { usuarioId: p.usuarioId, rol: p.rol };
	} catch {
		return null;
	}
}

const ROLES_EMERGENCIA = ['coordinador', 'admin', 'referente'];

export const GET: RequestHandler = async ({ cookies, url }) => {
	const s = sesionDe(cookies);
	if (!s) return problem(401, 'No autenticado');
	const zona = url.searchParams.get('zona_id');
	const activa = url.searchParams.get('activa');
	const items = await listarEntidad('emergencias', (e) => {
		if (zona && String(e.zona_id) !== zona) return false;
		if (activa === '1' && String(e.estado) !== 'activa') return false;
		return true;
	});
	return ok({ items, total: items.length });
};

export const POST: RequestHandler = async ({ cookies, request }) => {
	const s = sesionDe(cookies);
	if (!s) return problem(401, 'No autenticado', 'Inicie sesión.');
	if (!ROLES_EMERGENCIA.includes(s.rol))
		return problem(403, 'Permiso denegado', 'Solo coordinador, referente o admin pueden activar emergencia (RF12).');

	const key = requireIdempotency(request);
	if (typeof key !== 'string') return key;
	const b = await leerObjeto(request);
	if (esRespuesta(b)) return b;

	const errTexto = errorTextos(b, {
		zona_id: { max: 64 },
		tipo: { max: 40 },
		titulo: { min: 3, max: 80 }
	});
	if (errTexto) return problem(422, 'Datos inválidos', errTexto);
	const errFoto = validarFoto(b.foto);
	if (errFoto) return problem(422, 'Foto inválida', errFoto);

	// Validar tipo usando mapeo dominio↔UI
	const tipoValidado = obtenerTipoValidado(String(b.tipo));
	if (!tipoValidado) return problem(422, 'Tipo de emergencia inválido', `Tipo "${b.tipo}" no es un tipo de emergencia válido`);

	const existente = store.emergencias.find((e) => e.idempotencyKey === key);
	if (existente) return ok(existente, 200, { 'Idempotent-Replayed': 'true' });

	// Una emergencia activa por zona
	const previa = await listarEntidad('emergencias', (e) => e.zona_id === b.zona_id && e.estado === 'activa');
	if (previa.length > 0) await aplicarEntidadLWW('emergencias', { id: previa[0].id, zona_id: previa[0].zona_id, tipo: previa[0].tipo, titulo: previa[0].titulo, estado: 'desactivada', updated_at: new Date().toISOString() });

	const ahora = new Date().toISOString();
	const item = {
		id: crypto.randomUUID(),
		idempotencyKey: key,
		zona_id: String(b.zona_id ?? 'z1'),
		tipo: String(b.tipo ?? 'otro'),
		titulo: String(b.titulo).trim(),
		foto: b.foto ?? null,
		estado: 'activa',
		activado_por: s.usuarioId,
		activada_en: ahora,
		desactivada_en: null,
		created_at: ahora,
		updated_at: ahora
	};
	await crearEntidad('emergencias', item);

	await crearEntidad('notificaciones', {
		id: crypto.randomUUID(),
		tipo: 'emergencia',
		usuario_id: null,
		mensaje: `🚨 Modo emergencia activado: ${item.titulo}`,
		leído: 0,
		creado_en: ahora,
		updated_at: ahora
	});

	return ok(item, 201);
};

export const PATCH: RequestHandler = async ({ cookies, params, request }) => {
	const s = sesionDe(cookies);
	if (!s) return problem(401, 'No autenticado');
	if (!ROLES_EMERGENCIA.includes(s.rol)) return problem(403, 'Permiso denegado');

	const zonaId = b.zona_id;
	if (!zonaId) return problem(400, 'Falta zona_id');

		const existe = store.emergencias.find((e) => e.zona_id === zonaId && e.estado === 'activa');
		if (!existe) return problem(404, 'Emergencia activa no encontrada en esa zona');

		if (b.estado === 'desactivada' || b.estado === 'atendida') {
			await aplicarEntidadLWW('emergencias', { id: existe.id, zona_id: existe.zona_id, tipo: existe.tipo, titulo: existe.titulo, estado: String(b.estado), updated_at: new Date().toISOString() });
			const actualizada = await obtenerEntidad('emergencias', existe.id);
			// Registrar cambio de estado en notificaciones
			const ahora = new Date().toISOString();
			await crearEntidad('notificaciones', {
				id: crypto.randomUUID(),
				tipo: 'emergencia_estado_cambiado',
				usuario_id: s.usuarioId,
				mensaje: `📋 Estado de emergencia actualizado a "${b.estado}"`,
				leído: 0,
				creado_en: ahora,
				updated_at: ahora
			});
			return ok(actualizada);
		}
		return problem(422, 'Estado inválido', 'Use desactivada o atendida.');
};
