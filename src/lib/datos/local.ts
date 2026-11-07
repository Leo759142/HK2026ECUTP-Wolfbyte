import { dao } from '../../datos/dao';

/** Compatibilidad con módulo previo; delega en DAO unificado. */
export interface ZonaPagina {
	siguiente: string | null;
	total: number;
	items?: unknown[];
}

class BdLocal {
	async descargarZonaTabla(
		tabla: string,
		filtro: { zona_id: string; cursor: string | null; limite: number }
	): Promise<ZonaPagina> {
		const rows = await dao.listarLocal<Record<string, unknown>>(tabla);
		const filtered = rows.filter((r) => !filtro.zona_id || r.zona_id === filtro.zona_id);
		const start = filtro.cursor ? Math.max(0, Number(filtro.cursor) || 0) : 0;
		const page = filtered.slice(start, start + filtro.limite);
		const next = start + filtro.limite < filtered.length ? String(start + filtro.limite) : null;
		return { siguiente: next, total: filtered.length, items: page };
	}
}

const bd = new BdLocal();
export default bd;
