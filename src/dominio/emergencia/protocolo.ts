import type { Alerta } from './alerta';
import type { RecursoCritico } from './recursocritico';

export class ProtocoloEmergencia {
  /**
   * Ordena y filtra las alertas priorizando el nivel de urgencia (3 -> 1) para el tablero humanitario.
   */
  static priorizarAlertas(alertas: Alerta[]): Alerta[] {
    return [...alertas].sort((a, b) => b.urgencia - a.urgencia);
  }

  /**
   * Filtra únicamente los suministros que se encuentran activos y disponibles en la zona afectada.
   */
  static extraerRecursosDisponibles(recursos: RecursoCritico[]): RecursoCritico[] {
    return recursos.filter(r => r.disponibilidad);
  }
}
