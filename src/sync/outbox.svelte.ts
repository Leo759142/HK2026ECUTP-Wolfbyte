// Cada acción del usuario se guarda local + en cola, en UNA transacción.
type Estado = 'pendiente' | 'enviando' | 'confirmado' | 'conflicto' | 'fallido';

interface Mutacion {
  id: string;            // UUID: la idempotencia (el servidor ignora repetidos)
  entidad: string;       // 'favor', 'visto_bueno', 'alerta'...
  estrategia: 'solo_agregar' | 'or_set' | 'fusion' | 'ultimo_gana';
  baseRev?: number;      // revisión desde la que editó el cliente (para 409)
  payload: unknown;
  creadoEn: number;
  intentos: number;
  estado: Estado;
}

class Outbox {
  cola = $state<Mutacion[]>([]);           // la UI lee esto: refleja el estado real
  pendientes = $derived(this.cola.filter(m => m.estado !== 'confirmado').length);

  async encolar(m: Omit<Mutacion, 'id' | 'creadoEn' | 'intentos' | 'estado'>) {
    const nueva: Mutacion = { ...m, id: crypto.randomUUID(),
      creadoEn: Date.now(), intentos: 0, estado: 'pendiente' };
    await dao.transaccion(async () => {    // atómico: dato + cola o nada
      await dao.aplicarLocal(nueva);       // UI optimista: se ve de inmediato
      await dao.guardarMutacion(nueva);
    });
    this.cola.push(nueva);
    this.vaciar();                         // intenta enviar si hay red
  }

  async vaciar() {
    if (!navigator.onLine) return;
    // Orden por antigüedad: "crear" siempre llega antes que "editar"
    for (const m of [...this.cola].sort((a, b) => a.creadoEn - b.creadoEn)) {
      if (m.estado === 'confirmado') continue;
      m.estado = 'enviando';
      const r = await enviar(m).catch(() => null);
      if (r?.ok) m.estado = 'confirmado';
      else if (r?.status === 409) { m.estado = 'conflicto'; await resolver(m, r.remoto); }
      else { m.estado = 'pendiente'; m.intentos++; await esperar(backoff(m.intentos)); break; }
    }
  }
}
export const outbox = new Outbox();