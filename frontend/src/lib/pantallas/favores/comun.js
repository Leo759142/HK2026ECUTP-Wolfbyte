/* Lógica compartida de la Cadena de Favores (antes en Favores.jsx). */
import { RESERVA_MS } from '../../data.js';

export function detallesFavor(f) {
  const d = f.detalles ?? {};
  const lineas = {
    presto: [['⏱️', d.duracion && `Por ${d.duracion.toLowerCase()}`], ['📝', d.condicion]],
    regalo: [['📦', d.estado], ['🔢', d.cantidad]],
    intercambio: [['🎁', d.ofrezco && `Ofrece: ${d.ofrezco}`], ['🔄', d.busco && `Busca: ${d.busco}`]],
    pido: [['🏷️', d.clase], ['📅', d.cuando && `Para: ${d.cuando.toLowerCase()}`]],
  }[f.tipo];
  return (lineas ?? []).filter(([, v]) => v);
}

export function minutosRestantes(f) {
  return Math.max(0, Math.ceil((RESERVA_MS - (Date.now() - (f.reservedAt ?? 0))) / 60000));
}
