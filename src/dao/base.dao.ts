import { dao as legacyDao, type OperacionOutbox } from '../datos/dao';
import { outboxDAO } from '../datos/outbox';

export type { OperacionOutbox };

/**
 * Contrato DAO genérico (RF17/RF18 base) sobre adaptador KV actual.
 * Sin reglas de negocio; solo acceso a datos.
 */
export interface DaoBase<T = Record<string, unknown>> {
	obtenerPorId(id: string): Promise<T | null>;
	listar(): Promise<T[]>;
	guardar(entidad: string, payload: Record<string, unknown>): Promise<void>;
	eliminar(entidad: string, id: string): Promise<void>;
}

export class BaseDaoLocal {
	async obtenerPorId(entidad: string, id: string): Promise<any> {
		return legacyDao.obtenerLocal(entidad, id);
	}
	async listar(entidad: string): Promise<any[]> {
		return legacyDao.listarLocal(entidad);
	}
	async guardar(entidad: string, payload: Record<string, unknown>): Promise<void> {
		await legacyDao.aplicarLocal(entidad, payload);
	}
	async eliminar(entidad: string, id: string): Promise<void> {
		await legacyDao.eliminarLocal(entidad, id);
	}
	async transaccion<T>(fn: () => Promise<T>): Promise<T> {
		return legacyDao.transaccion(fn);
	}
	async encolar(op: {
		op_id: string;
		entidad: string;
		operacion: any;
		payload: unknown;
	}): Promise<void> {
		await legacyDao.encolar(op);
	}
}

export const baseDao = new BaseDaoLocal();
export { legacyDao as dao, outboxDAO };
