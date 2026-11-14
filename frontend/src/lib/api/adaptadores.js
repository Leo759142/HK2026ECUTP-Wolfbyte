/* ==================================================================
 *  Adaptadores frontend ⇄ backend (único lugar con estas conversiones).
 *  Las pantallas siguen usando el modelo del prototipo (camelCase, fechas en ms,
 *  motivos de reporte en español) y la API usa el contrato OpenAPI (snake_case,
 *  ISO-8601, códigos). Ver docs/INTEGRACION.md → "Mapeo de datos".
 * ================================================================== */
import { MOTIVOS_REPORTE } from '../data.js';

export const ms = (iso) => (iso ? Date.parse(iso) : null);
export const iso = (n) => (n == null ? null : new Date(n).toISOString());

/* ---------- Motivos de reporte: texto de la pantalla ⇄ código de la base ---------- */
const CODIGOS_MOTIVO = ['estafa', 'falso', 'ofensivo', 'mala_experiencia', 'otro'];
export const motivoACodigo = (texto) => CODIGOS_MOTIVO[Math.max(0, MOTIVOS_REPORTE.indexOf(texto))] ?? 'otro';
export const codigoAMotivo = (codigo) => MOTIVOS_REPORTE[CODIGOS_MOTIVO.indexOf(codigo)] ?? MOTIVOS_REPORTE[MOTIVOS_REPORTE.length - 1];

/* ---------- Colecciones locales ⇄ entidades del servidor ---------- */
export const COLECCION_DE_OBJETO = { servicio: 'services', favor: 'favors' };
export const OBJETO_DE_COLECCION = { services: 'servicio', favors: 'favor' };

/* ---------- Vecinos ---------- */
/** VecinoPublico → user local. La API no entrega teléfonos ni apellidos completos de otros vecinos. */
export function vecinoALocal(v, sectorId) {
  if (!v) return null;
  const apellido = v.nombre_visible.slice(v.nombre.length).trim(); // "Rosa M." → "M." · "Luis Quispe" → "Quispe"
  return {
    id: v.id,
    firstName: v.nombre,
    lastName: apellido,
    manzana: v.manzana,
    sectorId,
    foto: v.foto ?? null,
    isGuardian: Boolean(v.es_guardian),
    showFullName: Boolean(v.mostrar_nombre_completo),
    verified: true,
    createdAt: ms(v.creado_en),
  };
}

/** Usuario (mi cuenta) → user local completo. */
export function usuarioALocal(u) {
  return {
    id: u.id,
    firstName: u.nombre,
    lastName: u.apellido ?? '',
    phone: u.telefono,
    sectorId: u.sector_id,
    manzana: u.manzana,
    location: u.lat_aprox == null ? null : { lat: u.lat_aprox, lng: u.lng_aprox },
    address: u.direccion ?? '',
    district: u.distrito ?? '',
    reference: u.referencia ?? '',
    foto: u.foto ?? null,
    verified: u.verificado,
    showFullName: u.mostrar_nombre_completo,
    inviteAnswered: u.invitacion_guardian ?? null,
    lang: u.idioma,
    largeText: u.letra_grande,
    isGuardian: u.es_guardian,
    caminoGuardian: u.camino_guardian ?? null,
    createdAt: ms(u.creado_en),
    updatedAt: ms(u.actualizado_en),
  };
}

/** Cambios de mi perfil (user local) → cuerpo de PATCH /usuarios/me. */
export function perfilADto(patch) {
  const out = {};
  if ('showFullName' in patch) out.mostrar_nombre_completo = patch.showFullName;
  if ('manzana' in patch) out.manzana = patch.manzana;
  if ('lang' in patch) out.idioma = patch.lang;
  if ('largeText' in patch) out.letra_grande = patch.largeText;
  if ('foto' in patch) out.foto = patch.foto;
  if ('district' in patch) out.distrito = patch.district;
  if ('address' in patch) out.direccion = patch.address;
  if ('reference' in patch) out.referencia = patch.reference;
  return out;
}

/* ---------- Sectores ---------- */
export function sectorALocal(s) {
  return {
    id: s.id,
    name: s.nombre,
    manzanas: s.manzanas,
    guardianIds: (s.guardianes ?? []).map((g) => g.id),
    founderId: s.fundador_id ?? null,
    totalVecinos: s.total_vecinos ?? 0,
    createdAt: ms(s.creado_en),
  };
}

/* ---------- Servicios ---------- */
export function servicioALocal(s) {
  return {
    id: s.id,
    ownerId: s.dueno_id,
    clase: s.clase,
    categoria: s.categoria,
    titulo: s.titulo,
    descripcion: s.descripcion,
    horario: s.horario,
    precio: s.precio ?? '',
    foto: s.foto ?? null,
    showFullName: s.mostrar_nombre_completo,
    // El frontend usa status 'oculto' cuando un Guardián la ocultó y hidden mientras está en revisión.
    status: s.moderacion === 'oculto' ? 'oculto' : s.estado,
    hidden: s.moderacion !== 'visible',
    moderacion: s.moderacion,
    baseVistos: s.vistos_base ?? 0,
    baseTags: s.etiquetas_base ?? {},
    // Nombre del dueño tal como lo eligió para ESTE servicio (completo si marcó "mostrar mi nombre").
    ownerName: s.dueno?.nombre_visible ?? null,
    createdAt: ms(s.creado_en),
    updatedAt: ms(s.actualizado_en),
  };
}

export function servicioADto(local) {
  return {
    clase: local.clase,
    categoria: local.categoria,
    titulo: local.titulo,
    descripcion: local.descripcion,
    horario: local.horario,
    precio: local.precio || null,
    foto: local.foto ?? null,
    mostrar_nombre_completo: Boolean(local.showFullName),
  };
}

export const recomendacionALocal = (r) => ({
  id: r.id,
  serviceId: r.servicio_id,
  userId: r.usuario_id,
  tags: r.etiquetas,
  comment: r.comentario,
  createdAt: ms(r.creado_en),
});

export const contactoALocal = (c) => ({
  id: c.id,
  serviceId: c.servicio_id,
  userId: c.usuario_id,
  answered: c.respondido,
  attended: c.atendido,
  createdAt: ms(c.creado_en),
});

/* ---------- Favores ---------- */
export function favorALocal(f) {
  return {
    id: f.id,
    ownerId: f.dueno_id,
    tipo: f.tipo,
    titulo: f.titulo,
    detalles: f.detalles ?? {},
    foto: f.foto ?? null,
    status: f.moderacion === 'oculto' ? 'oculto' : f.estado,
    hidden: f.moderacion !== 'visible',
    moderacion: f.moderacion,
    takerId: f.tomador_id ?? null,
    reservedAt: ms(f.reservado_en),
    ownerConfirmed: f.dueno_confirmo,
    takerConfirmed: f.tomador_confirmo,
    closedAt: ms(f.cerrado_en),
    whatsappUrl: f.whatsapp_url ?? null,
    createdAt: ms(f.creado_en),
    updatedAt: ms(f.actualizado_en),
  };
}

export const favorADto = (local) => ({ tipo: local.tipo, titulo: local.titulo, detalles: local.detalles ?? {}, foto: local.foto ?? null });

/* ---------- Moderación ---------- */
export const reporteALocal = (r) => ({
  id: r.id,
  col: COLECCION_DE_OBJETO[r.objeto_tipo],
  targetId: r.objeto_id,
  userId: r.usuario_id,
  reason: codigoAMotivo(r.motivo),
  createdAt: ms(r.creado_en),
});

export const moderacionALocal = (p) => ({
  id: `${p.objeto_tipo}:${p.objeto_id}`,
  col: COLECCION_DE_OBJETO[p.objeto_tipo],
  targetId: p.objeto_id,
  total: p.total_reportes,
  titulo: p.titulo,
  descripcion: p.descripcion,
  hidden: p.moderacion !== 'visible',
  motivoPrincipal: codigoAMotivo(p.motivo_principal),
  ownerId: p.dueno?.id ?? null,
  createdAt: ms(p.primer_reporte),
});

/* ---------- Emergencias ---------- */
export function emergenciaALocal(e, yoId) {
  return {
    id: e.id,
    sectorId: e.sector_id,
    reporterId: e.reportero_id,
    tipo: e.tipo,
    texto: e.texto ?? '',
    foto: e.foto ?? null,
    manzana: e.manzana,
    status: e.estado,
    confirmedBy: e.confirmada_por ?? null,
    confirmedAt: ms(e.confirmada_en),
    motivo: e.motivo_descarte ?? '',
    reviewedBy: e.revisada_por ?? null,
    reviewedAt: ms(e.revisada_en),
    endedAt: ms(e.atendida_en),
    closedBy: e.cerrada_por ?? null,
    reporterSeen: e.reportero_visto,
    // El servidor solo nos cuenta NUESTRA respuesta; los totales vienen en `resumen` (Guardianes).
    acks: e.mi_respuesta ? { [yoId]: e.mi_respuesta } : {},
    endSeen: e.fin_visto ? { [yoId]: true } : {},
    confirmaciones: e.confirmaciones ?? null,
    resumen: e.resumen ?? null,
    createdAt: ms(e.creado_en),
    updatedAt: ms(e.actualizado_en),
  };
}

export function pedidoALocal(p) {
  return {
    id: p.id,
    emergencyId: p.emergencia_id,
    ownerId: p.dueno_id,
    necesidad: p.necesidad,
    quienes: p.vulnerables ?? [],
    cuantas: p.cuantas,
    texto: p.texto ?? '',
    foto: p.foto ?? null,
    manzana: p.manzana,
    status: p.estado,
    helperId: p.ayudante_id ?? null,
    helperAt: ms(p.ayudante_en),
    resolvedAt: ms(p.resuelto_en),
    // Privacidad: solo lo reciben quien pidió y quien va en camino.
    contactPhone: p.contacto_telefono ?? null,
    // Solo Guardianes durante una emergencia activa.
    direccionExacta: p.direccion_exacta ?? null,
    createdAt: ms(p.creado_en),
    updatedAt: ms(p.actualizado_en),
  };
}

export const grupoALocal = (g) => ({
  id: g.id,
  sectorId: g.sector_id,
  emoji: g.emoji,
  name: g.nombre,
  meta: g.meta,
  recurso: g.recurso ?? null,
  manzana: g.manzana ?? null,
  contacto: { tipo: g.contacto_tipo, valor: g.contacto_valor },
  createdAt: ms(g.creado_en),
});
