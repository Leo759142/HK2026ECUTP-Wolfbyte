// @ts-nocheck

import { DIAS_PARA_GUARDIAN } from './data';

const DIA = 24 * 60 * 60 * 1000;

/** "Rosa M." para vecinos; "Rosa Mendoza" si la persona eligió mostrarlo. */
export function nombreVisible(user, completo = false) {
  if (!user) return 'Vecino';
  const apellido = (user.lastName ?? '').trim();
  if (completo || user.showFullName) return `${user.firstName} ${apellido}`.trim();
  return apellido ? `${user.firstName} ${apellido[0]}.` : user.firstName;
}

export const inicial = (user) => (user?.firstName?.[0] ?? '?').toUpperCase();

/** Distancia aproximada en cuadras según la manzana (A, B, C…). */
export function cuadras(manzanaA, manzanaB) {
  if (!manzanaA || !manzanaB) return 1;
  return Math.abs(manzanaA.charCodeAt(0) - manzanaB.charCodeAt(0));
}
export function cuadrasTxt(n) {
  if (n <= 0) return 'en tu cuadra';
  return n === 1 ? 'a 1 cuadra' : `a ${n} cuadras`;
}

export function hace(ts) {
  if (!ts) return '';
  const min = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'ayer' : `hace ${d} días`;
}

export function hora(ts) {
  return new Date(ts).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

export const normalizar = (text = '') =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

export const diasEnAyni = (user) => (user?.createdAt ? Math.floor((Date.now() - user.createdAt) / DIA) : 0);
export const progresoGuardian = (user) => Math.min(1, diasEnAyni(user) / DIAS_PARA_GUARDIAN);

/** Balance de Ayni: favores dados y recibidos (solo favores cerrados y confirmados). */
export function balanceAyni(userId, favores) {
  let dados = 0;
  let recibidos = 0;
  for (const f of favores) {
    if (f.status !== 'cerrado') continue;
    // En "pido" ayuda quien responde; en presto/regalo/intercambio ayuda quien publica.
    const daId = f.tipo === 'pido' ? f.takerId : f.ownerId;
    const recibeId = f.tipo === 'pido' ? f.ownerId : f.takerId;
    if (daId === userId) dados += 1;
    if (recibeId === userId) recibidos += 1;
  }
  return { dados, recibidos };
}

/** Total de Vistos Buenos y conteo por etiqueta de un servicio. */
export function statsServicio(servicio, recomendaciones) {
  const propias = recomendaciones.filter((r) => r.serviceId === servicio.id);
  const tags = { ...(servicio.baseTags ?? {}) };
  for (const r of propias) for (const t of r.tags ?? []) tags[t] = (tags[t] ?? 0) + 1;
  const topTags = Object.entries(tags)
    .sort((a, b) => b[1] - a[1])
    .map(([id, count]) => ({ id, count }));
  return { count: (servicio.baseVistos ?? 0) + propias.length, topTags, comentarios: propias.filter((r) => r.comment) };
}

export function whatsappLink(phone, text) {
  return `https://wa.me/${String(phone).replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
}

export function abrirEnlace(url) {
  if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener');
}

/** Hash simple para dar posiciones estables a los pines del mapa. */
export function hash(text = '') {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

/** Posición (en %) de un pin dentro de la manzana indicada, con un leve desorden. */
export function posicionPin(manzanas, manzana, id, cols) {
  const index = Math.max(0, manzanas.indexOf(manzana));
  const rows = Math.ceil(manzanas.length / cols);
  const col = index % cols;
  const row = Math.floor(index / cols);
  const h = hash(id);
  const fx = (h % 97) / 97;
  const fy = ((h >>> 7) % 89) / 89;
  const w = 100 / cols;
  const hh = 100 / rows;
  return { left: col * w + w * (0.22 + 0.56 * fx), top: row * hh + hh * (0.22 + 0.56 * fy) };
}

/** Reduce una foto a máx. 480px en JPEG para no llenar localStorage (~5 MB). */
export function comprimirImagen(file, max = 480) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
