import type { Idioma } from './formatos';

export const DICCIONARIO_LOCAL: Record<Idioma, Record<string, string>> = {
  es: {
    'emergencia.titulo': 'TABLERO DE AYUDA HUMANITARIA',
    'emergencia.subtitulo': 'Recursos críticos disponibles en tu manzana',
    'emergencia.alerta_vacio': 'No hay alertas críticas reportadas en este sector.',
    'favor.estado.abierto': 'Abierto',
    'favor.estado.acordado': 'Ayuda en camino',
    'favor.estado.cerrado': 'Cerrado y confirmado',
    'favor.boton.cumplido': 'Confirmar Intercambio ("Se cumplió")',
    'offline.pendiente': 'Pendiente de enviar (Guardado en dispositivo)',
    'offline.enviado': 'Enviada con éxito al vecindario',
    'error.generico': 'Algo salió mal. El mensaje te indicará cómo corregirlo.',
    'error.permiso': 'Tu rol actual no tiene autorización para esta acción.'
  },
  qu: {
    // Inicializado en español como contingencia activa para evitar caídas de renderizado (Graceful Degradation)
    // El traductor inyectará los morfemas del quechua chanka/collao en la siguiente iteración sin alterar el núcleo
    'emergencia.titulo': 'LLAKTA AYUDA TARPUY (EMERGENCIA)',
    'emergencia.subtitulo': 'Suministros en tu manzana',
    'emergencia.alerta_vacio': 'Manam kanchu alerts kay pacha.',
    'favor.estado.abierto': 'Kichasqa',
    'favor.estado.acordado': 'Ayuda en camino',
    'favor.estado.cerrado': 'Wichqasqa',
    'favor.boton.cumplido': 'Se cumplió',
    'offline.pendiente': 'Pendiente de enviar',
    'offline.enviado': 'Enviada',
    'error.generico': 'Pantay pacha',
    'error.permiso': 'Manam permisochu kani.'
  }
};

export class GestorIdiomas {
  private _idiomaActual: Idioma = 'es';

  constructor(idiomaInicial: Idioma = 'es') {
    this._idiomaActual = idiomaInicial;
  }

  get idiomaActual(): Idioma {
    return this._idiomaActual;
  }

  cambiarIdioma(nuevoIdioma: Idioma): void {
    this._idiomaActual = nuevoIdioma;
  }

  /**
   * Recupera la cadena de texto con fallback automático al español si la clave no existe en Quechua.
   */
  t(clave: string): string {
    const traduccion = DICCIONARIO_LOCAL[this._idiomaActual]?.[clave];
    if (!traduccion) {
      return DICCIONARIO_LOCAL['es']?.[clave] || clave;
    }
    return traduccion;
  }
}
