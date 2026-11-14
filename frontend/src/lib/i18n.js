/* Textos traducibles. Lo que no está traducido usa el español.
 * Runasimi (quechua): solo hay algunos textos de muestra. Antes de presentar,
 * validarlos y completarlos con una persona quechuahablante. */
const DICT = {
  es: {
    'nav.inicio': 'Inicio',
    'nav.favores': 'Favores',
    'nav.mapa': 'Mapa',
    'nav.yo': 'Yo',
    'nav.ahora': 'Ahora',
    'nav.grupos': 'Grupos',
    'nav.publicar': 'Publicar',
    hola: '¡Hola',
    lema: 'Hoy por ti, mañana por mí',
    buscar: '¿Qué necesitas hoy?',
    oficios: 'Oficios del barrio',
    recomendados: 'Los más recomendados',
    crearCuenta: 'Crear cuenta',
    yaTengo: 'Ya tengo cuenta',
    favores: 'Cadena de Favores',
    favoresSub: 'Sin dinero, entre vecinos',
    reportar: '¿Pasa algo grave? Reportar emergencia',
    misPublicaciones: 'Mis publicaciones',
    idioma: 'Idioma y lectura',
    enLinea: 'En línea',
    sinConexion: 'Sin conexión · Ahorrando datos. Ves lo último guardado.',
  },
  en: {
    'nav.inicio': 'Home',
    'nav.favores': 'Favors',
    'nav.mapa': 'Map',
    'nav.yo': 'Me',
    'nav.ahora': 'Now',
    'nav.grupos': 'Groups',
    'nav.publicar': 'Post',
    hola: 'Hi',
    lema: 'Today for you, tomorrow for me',
    buscar: 'What do you need today?',
    oficios: 'Neighborhood trades',
    recomendados: 'Most recommended',
    crearCuenta: 'Create account',
    yaTengo: 'I already have an account',
    favores: 'Chain of Favors',
    favoresSub: 'No money, between neighbors',
    reportar: 'Something serious? Report an emergency',
    misPublicaciones: 'My posts',
    idioma: 'Language & reading',
    enLinea: 'Online',
    sinConexion: 'Offline · Saving data. You are seeing the last saved info.',
  },
  qu: {
    hola: '¡Allinllachu',
  },
};

export const IDIOMAS = [
  { id: 'es', label: 'Español' },
  { id: 'en', label: 'English' },
  { id: 'qu', label: 'Runasimi (quechua)' },
];

export function translate(lang, key) {
  return DICT[lang]?.[key] ?? DICT.es[key] ?? key;
}
