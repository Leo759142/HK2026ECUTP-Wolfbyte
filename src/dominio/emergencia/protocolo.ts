import type { EstadoAlerta } from '../tipos/tipos';
import { Alerta } from './alerta';
import { RecursoCritico } from './recursocritico';

const PRIORIDAD_ALERTA: Record<EstadoAlerta, number> = {
	confirmado_vecinos: 3,
	sin_verificar: 2,
	atendido: 1,
	descartado: 0
};

export class ProtocoloEmergencia {
	/** Prioriza confirmadas por vecinos, luego sin verificar, luego atendidas/descartadas. */
	static priorizarAlertas(alertas: Alerta[]): Alerta[] {
		return [...alertas].sort((a, b) => {
			const p = PRIORIDAD_ALERTA[b.estado] - PRIORIDAD_ALERTA[a.estado];
			return p !== 0 ? p : b.creado_en.localeCompare(a.creado_en);
		});
	}

	static extraerRecursosDisponibles(recursos: RecursoCritico[]): RecursoCritico[] {
		return recursos.filter((r) => r.estaDisponible());
	}
}
