// @ts-nocheck

/** Iconos Font Awesome envueltos para uso con Tailwind. */
export function Icon({ name, className = '', ...props }) {
  return <i className={`fa-solid ${name} ${className}`} aria-hidden="true" {...props} />;
}

export const FA = {
  volver: 'fa-arrow-left',
  emergencia: 'fa-triangle-exclamation',
  favor: 'fa-hand-holding-heart',
  mapa: 'fa-map',
  perfil: 'fa-user',
  idioma: 'fa-language',
  foto: 'fa-camera',
  conexion: 'fa-wifi',
  sinConexion: 'fa-wifi-slash',
  guardia: 'fa-shield-halved',
  reporte: 'fa-flag',
};