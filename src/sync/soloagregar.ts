import type { EventoComun } from '../dominio/tipos/tipos';

export class ResolutorSoloAgregar {
	static unificar<T extends EventoComun>(historicoServidor: T[], colaLocal: T[]): T[] {
		const mapa = new Map<string, T>();
		for (const evento of historicoServidor) mapa.set(evento.id, evento);
		for (const evento of colaLocal) if (!mapa.has(evento.id)) mapa.set(evento.id, evento);
		return [...mapa.values()].sort((a, b) => a.creadoEn.getTime() - b.creadoEn.getTime());
	}
}
