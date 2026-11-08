/** Iconos SVG inline sin dependencias externas. */
const SVG_ICONS = {
  volver: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  ),
  emergencia: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  favor: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 13h1v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8h1M19 7l-2.29 2.29-2.29-2.29a4 4 0 0 0-5.42 0l-2.29 2.29" />
    </svg>
  ),
  mapa: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 6 18 6 21 18 3 18" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  perfil: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  idioma: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 14h2" />
      <path d="M14 10h4" />
      <path d="M12 6v10" />
      <path d="M17 16s2 2 4 2 4-2 4-2V9l-4-4-4 4v11" />
    </svg>
  ),
  foto: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  conexion: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M5 12.55h14" />
    </svg>
  ),
  sinConexion: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M5 12.55h14" />
      <path d="M12.55 17a11 11 0 0 1 0-14" />
      <path d="M12.55 3v14" />
    </svg>
  ),
  guardia: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v3c0 6 8 10 8 10" />
    </svg>
  ),
  reporte: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  reloj: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  whatsapp: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12c0-4.71-3.82-8.53-8.53-8.53S5 7.29 5 12c0 3.52 2.24 6.5 5.36 7.76l-.36 2.72 2.72-.36c1.26 3.12 4.24 5.36 7.76 5.36S22 15.53 22 12z" />
    </svg>
  ),
  telefono: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  guardar: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  ),
  editar: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  eliminar: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  check: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  close: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  mas: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  menos: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  flechaDerecha: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  ),
  alerta: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  star: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  relojPendiente: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
};

export function Icon({ name, className = '', ...props }) {
  const icon = SVG_ICONS[name];
  if (!icon) {
    console.warn(`[AYNI] Icono no encontrado: "${name}"`);
    return <span className={`${className} text-gris`} aria-hidden="true">{name}</span>;
  }
  return (
    <span className={`inline-block ${className}`} aria-hidden="true" {...props}>
      {icon}
    </span>
  );
}

export const ICONOS = {
  volver: 'volver',
  emergencia: 'emergencia',
  favor: 'favor',
  mapa: 'mapa',
  perfil: 'perfil',
  idioma: 'idioma',
  foto: 'foto',
  conexion: 'conexion',
  sinConexion: 'sinConexion',
  guardia: 'guardia',
  reporte: 'reporte',
  reloj: 'reloj',
  whatsapp: 'whatsapp',
  telefono: 'telefono',
  guardar: 'guardar',
  editar: 'editar',
  eliminar: 'eliminar',
  check: 'check',
  close: 'close',
  mas: 'mas',
  menos: 'menos',
  flechaDerecha: 'flechaDerecha',
  alerta: 'alerta',
  star: 'star',
  relojPendiente: 'relojPendiente',
};

/** Mapeo de emojis comunes a nombres de iconos SVG.
 * Se usa como fallback en OptionGrid cuando no se especifica `icon` explícitamente. */
export const EMOJI_A_ICONO = {
  '🌊': 'alerta',
  '🔥': 'alerta',
  '🏚️': 'alerta',
  '🚱': 'conexion',
  '🚑': 'guardia',
  '❓': 'alerta',
  '🔧': 'editar',
  '⚡': 'conexion',
  '🪚': 'editar',
  '🔑': 'guardar',
  '🐕': 'star',
  '📚': 'star',
  '✂️': 'star',
  '🍲': 'star',
  '🧰': 'editar',
  '🙋': 'mas',
  '🤝': 'favor',
  '🛠️': 'editar',
  '⏳': 'reloj',
  '🛡️': 'guardia',
  '✅': 'check',
  '📍': 'mapa',
  '📷': 'foto',
  '📱': 'telefono',
  '💬': 'whatsapp',
  '🚨': 'emergencia',
  '⏰': 'reloj',
  '🔍': 'buscar',
  '⚙️': 'editar',
  '💾': 'guardar',
  '🗑️': 'eliminar',
  '✏️': 'editar',
  '❌': 'close',
  '➕': 'mas',
  '➖': 'menos',
  '➡️': 'flechaDerecha',
  '🌟': 'star',
  '⭐': 'star',
  '🔔': 'alerta',
  '🔕': 'sinConexion',
  '📶': 'conexion',
  '📵': 'sinConexion',
};

/** Convierte un emoji a su nombre de icono equivalente, o devuelve null si no hay mapeo. */
export function emojiToIcon(emoji) {
  return EMOJI_A_ICONO[emoji] ?? null;
}