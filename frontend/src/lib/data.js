/* Catálogos y reglas de negocio de AYNI (lo que decidió el equipo). */

export const DIAS_PARA_GUARDIAN = 60; // 2 meses de uso → invitación automática
export const RESERVA_MS = 60 * 60 * 1000; // un favor reservado se libera en 1 hora
export const REPORTES_PARA_OCULTAR = 3; // con 3 reportes una publicación se oculta sola
export const MAX_ETIQUETAS = 6;
export const CODIGO_DEMO = '1234'; // en producción llega por SMS

export const CATEGORIAS = [
  { id: 'gasfiteria', label: 'Gasfitería', emoji: '🔧' },
  { id: 'electricidad', label: 'Electricidad', emoji: '⚡' },
  { id: 'carpinteria', label: 'Carpintería', emoji: '🪚' },
  { id: 'cerrajeria', label: 'Cerrajería', emoji: '🔑' },
  { id: 'mascotas', label: 'Mascotas', emoji: '🐕' },
  { id: 'clases', label: 'Clases', emoji: '📚' },
  { id: 'costura', label: 'Costura', emoji: '✂️' },
  { id: 'comida', label: 'Comida casera', emoji: '🍲' },
  { id: 'otros', label: 'Otros', emoji: '🧰' },
];
export const catById = (id) => CATEGORIAS.find((c) => c.id === id) ?? CATEGORIAS[CATEGORIAS.length - 1];

export const ETIQUETAS = [
  { id: 'puntual', label: 'Puntual', emoji: '⏰' },
  { id: 'precio', label: 'Precio justo', emoji: '💰' },
  { id: 'limpio', label: 'Trabajo limpio', emoji: '✨' },
  { id: 'amable', label: 'Amable', emoji: '😊' },
  { id: 'rapido', label: 'Rápido', emoji: '⚡' },
  { id: 'volveria', label: 'Volvería a llamarlo', emoji: '🔁' },
];
export const etiquetaById = (id) => ETIQUETAS.find((e) => e.id === id);

/** Tipos de publicación en la Cadena de Favores. Clases completas para Tailwind. */
export const TIPOS_FAVOR = {
  pido: { label: 'PIDO', emoji: '🙋', chip: 'bg-ambar-claro text-tinta' },
  presto: { label: 'PRESTO', emoji: '🔨', chip: 'bg-petroleo-claro text-petroleo-osc' },
  regalo: { label: 'REGALO', emoji: '🎁', chip: 'bg-morado-claro text-morado-osc' },
  intercambio: { label: 'INTERCAMBIO', emoji: '🔄', chip: 'bg-white text-tinta border border-linea' },
};

export const TIPOS_EMERGENCIA = [
  { id: 'inundacion', label: 'Inundación', emoji: '🌊' },
  { id: 'incendio', label: 'Incendio', emoji: '🔥' },
  { id: 'sismo', label: 'Sismo o derrumbe', emoji: '🏚️' },
  { id: 'servicios', label: 'Sin agua o luz', emoji: '🚱' },
  { id: 'accidente', label: 'Accidente', emoji: '🚑' },
  { id: 'otro', label: 'Otro', emoji: '❓' },
];
export const emergenciaById = (id) => TIPOS_EMERGENCIA.find((e) => e.id === id) ?? TIPOS_EMERGENCIA[5];

export const NECESIDADES = [
  { id: 'agua', label: 'Agua', emoji: '💧' },
  { id: 'comida', label: 'Comida', emoji: '🍲' },
  { id: 'salud', label: 'Salud', emoji: '🩺' },
  { id: 'rescate', label: 'Rescate', emoji: '🛟' },
  { id: 'refugio', label: 'Refugio', emoji: '🏠' },
  { id: 'otro', label: 'Otro', emoji: '❓' },
];
export const necesidadById = (id) => NECESIDADES.find((n) => n.id === id) ?? NECESIDADES[5];

export const VULNERABLES = [
  { id: 'adulto', label: 'Adulto mayor', emoji: '👵' },
  { id: 'ninos', label: 'Niños', emoji: '👶' },
  { id: 'discapacidad', label: 'Discapacidad', emoji: '♿' },
  { id: 'gestante', label: 'Gestante', emoji: '🤰' },
  { id: 'mascotas', label: 'Mascotas', emoji: '🐕' },
];

export const RECURSOS = [
  { id: 'agua', label: 'Agua', emoji: '💧' },
  { id: 'refugio', label: 'Albergue', emoji: '🏫' },
  { id: 'salud', label: 'Salud', emoji: '🩺' },
  { id: 'comida', label: 'Comida', emoji: '🍲' },
  { id: 'energia', label: 'Energía', emoji: '🔌' },
  { id: 'traslado', label: 'Traslado', emoji: '🚐' },
];

export const NUMEROS_EMERGENCIA = [
  { label: 'Bomberos', numero: '116', emoji: '🚒' },
  { label: 'Policía', numero: '105', emoji: '👮' },
  { label: 'SAMU', numero: '106', emoji: '🚑' },
];

export const MOTIVOS_REPORTE = [
  'Parece estafa',
  'Información falsa',
  'Contenido ofensivo',
  'Mala experiencia con el servicio',
  'Otro motivo',
];
