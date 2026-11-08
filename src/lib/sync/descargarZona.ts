import bd from '#lib/datos/local';

export interface ZonaDescarga {
	tablas: string[];
	siguiente: string | null;
	progreso: number;
}

const TABLAS_ZONA = ['zonas', 'servicios', 'favores', 'alertas', 'anuncios'];

export async function descargarZona(
	zonaId: string,
	{ cursor = null, limite = 50 }: { cursor?: string | null; limite?: number } = {}
): Promise<ZonaDescarga> {
	let siguiente = cursor;
	let descargadas = 0;

	for (const tabla of TABLAS_ZONA) {
		const pagina = await bd.descargarZonaTabla(tabla, { zona_id: zonaId, cursor: siguiente, limite });
		siguiente = pagina.siguiente;
		descargadas += pagina.total;
		if (!siguiente) break;
	}

	const progreso = Math.round((descargadas / (TABLAS_ZONA.length * limite)) * 100);

	return {
		tablas: TABLAS_ZONA,
		siguiente,
		progreso: progreso > 100 ? 100 : progreso
	};
}
