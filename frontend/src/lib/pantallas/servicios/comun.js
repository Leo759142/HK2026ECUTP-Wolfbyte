/* Lógica compartida de servicios (antes useServicios en Servicios.jsx). */
import { datos } from '../../estado.svelte.js';
import { cuadras, statsServicio } from '../../util.js';

/** Servicios visibles con su dueño, Vistos Buenos y distancia. Llamar dentro de $derived. */
export function serviciosVisibles(user) {
  return datos.services
    .filter((s) => !s.hidden && (s.status === 'disponible' || (s.ownerId === user?.id && s.status !== 'oculto')))
    .map((s) => conDetalle(s, user));
}

export function conDetalle(s, user) {
  let owner = datos.users.find((u) => u.id === s.ownerId);
  // Si el vecino eligió mostrar su nombre completo en ESTE servicio, el servidor lo envía en ownerName.
  if (owner && s.showFullName && s.ownerName) owner = { ...owner, lastName: s.ownerName.slice(owner.firstName.length).trim() };
  return { ...s, owner, stats: statsServicio(s, datos.recommendations), dist: cuadras(user?.manzana, owner?.manzana) };
}

export const ORDEN = {
  recomendados: (a, b) => b.stats.count - b.dist * 2 - (a.stats.count - a.dist * 2),
  cerca: (a, b) => a.dist - b.dist || b.stats.count - a.stats.count,
  vistos: (a, b) => b.stats.count - a.stats.count,
};
