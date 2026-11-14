/**
 * Herramientas de demostración del frontend (Mi perfil → "Herramientas de demostración").
 * SOLO funcionan con AYNI_DEMO=true: en producción responden 404 y no existen atajos de permisos.
 */
import type { Consulta, Db } from '../db/index.ts';
import { config } from '../config.ts';
import { err } from '../http.ts';
import type { SesionActual } from '../auth/sesion.ts';
import * as sectores from '../repositorios/sectores.ts';
import * as favores from '../repositorios/favores.ts';
import { reiniciarDemo } from '../db/seed-demo.ts';
import * as v from '../validar.ts';

export function exigirDemo(): void {
	if (!config().demo) throw err.noEncontrado('Las herramientas de demostración están desactivadas en este servidor.', 'DEMO_DESACTIVADA');
}

/** "Ver AYNI como Guardián". */
export async function comoGuardian(db: Consulta, s: SesionActual, body: v.Cuerpo): Promise<void> {
	exigirDemo();
	if (v.booleano(body.activo, 'activo')) await sectores.agregarGuardian(db, s.sectorId, s.usuarioId);
	else await sectores.quitarGuardian(db, s.sectorId, s.usuarioId);
}

/** "Simular 2 meses en AYNI": mueve la fecha de alta y vuelve a ofrecer la invitación. */
export async function simularAntiguedad(db: Consulta, s: SesionActual, body: v.Cuerpo): Promise<void> {
	exigirDemo();
	const dias = body.dias === undefined ? 61 : v.entero(body.dias, 'dias', 0, 3650);
	await db.query(`UPDATE usuarios SET creado_en = now() - ($2::int * interval '1 day'), invitacion_guardian = NULL WHERE id = $1`, [s.usuarioId, dias]);
}

/** "Simular que el otro también confirmó" un favor reservado. */
export async function confirmarOtroLado(db: Consulta, s: SesionActual, favorId: string): Promise<void> {
	exigirDemo();
	const f = await favores.obtenerFavor(db, v.uuid(favorId, 'El favor'));
	if (!f || f.sector_id !== s.sectorId) throw err.noEncontrado();
	if (f.estado !== 'reservado') throw err.conflicto('El favor no está reservado.', 'NO_RESERVADO');
	if (f.dueno_id === s.usuarioId) await favores.confirmarLado(db, f.id, 'tomador');
	else if (f.tomador_id === s.usuarioId) await favores.confirmarLado(db, f.id, 'dueno');
	else throw err.prohibido();
}

/** "Reiniciar datos de demostración": borra TODO y vuelve a cargar el sector de ejemplo. */
export async function reiniciar(db: Db): Promise<void> {
	exigirDemo();
	await reiniciarDemo(db);
}
