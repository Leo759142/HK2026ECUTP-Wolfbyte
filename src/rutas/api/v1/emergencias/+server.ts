import type { RequestHandler } from './$types';
import { ok, problem, requireIdempotency, requireRol } from '../../_http';
import { cargarStore, persistirStore, store } from '../../_store';
import { elegir, errorTextos, esRespuesta, leerObjeto, validarFoto } from '../../_validar';

const CAMPOS = ['zona_id', 'tipo', 'titulo', 'foto'] as const;

export const POST: RequestHandler = async ({ request, cookies }) => {
	// Verificar sesión activa antes de cualquier operación
	const sesion = JSON.parse(cookies.get('pod_sesion') || '{}');
	if (!sesion.usuarioId) return problem(401, 'Sesión no válida');

	await cargarStore();

	// Requerir rol 'activar_emergencia' (Guardian o Coordinador)
	// requireRol verifica HMAC en la cookie y el rol derivado
	const rolCheck = requireRol(request, 'activar_emergencia');
	if (!(typeof rolCheck === 'string')) return rolCheck;

	const key = requireIdempotency(request);
	if (!(typeof key === 'string')) return key;
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

	const existente = store.emergencias.find((e) => e.id === key);
	if (existente) return ok(existente, 200, { 'Idempotent-Replayed': 'true' });

	const item = {
		...elegir(b, CAMPOS),
		id: key,
		activa: 1,
		activada_por: sesion.rol ?? 'Vecino',
		inicio: new Date().toISOString(),
		fin: null
	};
	store.emergencias.push(item);
	await persistirStore();
	return ok(item, 201);
};

export const PATCH: RequestHandler = async ({ request, params, cookies }) => {
	// Verificar sesión activa
	const sesion = JSON.parse(cookies.get('pod_sesion') || '{}');
	if (!sesion.usuarioId) return problem(401, 'Sesión no válida');

	await cargarStore();

	// Requerir rol 'activar_emergencia' para cerrar/modificar
	const rolCheck = requireRol(request, 'activar_emergencia');
	if (!(typeof rolCheck === 'string')) return rolCheck;

	const id = params.id || '';
	if (!id) return problem(400, 'ID de emergencia requerido');

	const b = await leerObjeto(request);
	if (esRespuesta(b)) return b;

	// Buscar y actualizar la emergencia existente
	const idx = store.emergencias.findIndex((e) => e.id === id);
	if (idx === -1) return problem(404, 'Emergencia no encontrada');

	// Solo Guardian/Coordinador pueden desactivar (fin: fecha)
	if (sesion.rol !== 'Guardian' && sesion.rol !== 'Coordinador de emergencia') {
		return problem(403, 'No tiene permisos para modificar esta emergencia');
	}

	// Actualizar: si viene fin, marcar como atendida/cerrada; si no, actualizar datos
	if (b.fin) {
		store.emergencias[idx].fin = b.fin;
	} else {
		store.emergencias[idx].tipo = b.tipo ?? store.emergencias[idx].tipo;
		store.emergencias[idx].titulo = b.titulo ?? store.emergencias[idx].titulo;
		store.emergencias[idx].zona_id = b.zona_id ?? store.emergencias[idx].zona_id;
	}

	await persistirStore();
	return ok(store.emergencias[idx]);
};