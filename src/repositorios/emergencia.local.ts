import { dao } from '../datos/dao';
import type { RepositorioAlerta, RepositorioEmergencia, RepositorioRecursoCritico } from '../dominio/repositorios';
import type { Alerta, Emergencia, RecursoCritico, UUID } from '../dominio/tipos/tipos';

/** RF13 reportar necesidad con ubicación aproximada (RF19). */
export class AlertaRepoLocal implements RepositorioAlerta {
	private entidad = 'alertas' as const;
	async listar(filtro?: { zona_id?: string }): Promise<Alerta[]> {
		const rows = await dao.listarLocal<Alerta>(this.entidad);
		return rows.filter((a) => !filtro?.zona_id || a.zona_id === filtro.zona_id);
	}
	async guardar(alerta: Alerta, opId = crypto.randomUUID()): Promise<Alerta> {
		await dao.transaccion(async () => {
			await dao.aplicarLocal(this.entidad, alerta as unknown as Record<string, unknown>);
			await dao.encolar({ op_id: opId, entidad: this.entidad, operacion: 'crear', payload: alerta });
		});
		return alerta;
	}
}

/** RF12 activar emergencia (solo coordinador vía RBAC en borde). RF22 anuncios se pausan según estado. */
export class EmergenciaRepoLocal implements RepositorioEmergencia {
	private entidad = 'emergencias' as const;
	async activar(emergencia: Emergencia, opId = crypto.randomUUID()): Promise<Emergencia> {
		await dao.transaccion(async () => {
			await dao.aplicarLocal(this.entidad, emergencia as unknown as Record<string, unknown>);
			await dao.encolar({ op_id: opId, entidad: this.entidad, operacion: 'crear', payload: emergencia });
		});
		return emergencia;
	}
	async activaPorZona(zonaId: UUID): Promise<Emergencia | null> {
		const rows = await dao.listarLocal<Emergencia>(this.entidad);
		return rows.find((e) => e.zona_id === zonaId && e.activa === 1) ?? null;
	}
}

/** RF15 recursos críticos compartibles. */
export class RecursoCriticoRepoLocal implements RepositorioRecursoCritico {
	private entidad = 'recursos_criticos' as const;
	async listar(filtro?: { zona_id?: string; emergencia_id?: string }): Promise<RecursoCritico[]> {
		const rows = await dao.listarLocal<RecursoCritico>(this.entidad);
		return rows.filter((r) => (!filtro?.zona_id || r.zona_id === filtro.zona_id) && (!filtro?.emergencia_id || r.emergencia_id === filtro.emergencia_id));
	}
	async guardar(recurso: RecursoCritico, opId = crypto.randomUUID()): Promise<RecursoCritico> {
		await dao.transaccion(async () => {
			await dao.aplicarLocal(this.entidad, recurso as unknown as Record<string, unknown>);
			await dao.encolar({ op_id: opId, entidad: this.entidad, operacion: 'crear', payload: recurso });
		});
		return recurso;
	}
}
