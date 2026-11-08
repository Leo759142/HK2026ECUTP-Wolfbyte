import type { Idioma } from '../dominio/tipos/tipos';

export type { Idioma };

export class FormateadorComunitario {
  static obtenerPluralVistosBuenos(conteo: number, idioma: Idioma): string {
    if (idioma === 'qu') {
      return conteo === 1 ? 'allin qusqa' : `${conteo} allin qusqakuna`;
    }
    if (idioma === 'en') {
      return conteo === 1 ? '1 recommended' : `${conteo} recommended`;
    }
    return conteo === 1 ? '1 recomendado' : `${conteo} recomendados`;
  }

  static fechaCorta(fecha: Date, idioma: Idioma): string {
    const locale = idioma === 'es' ? 'es-PE' : idioma === 'en' ? 'en-US' : 'es-PE';
    const opciones: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
    return new Intl.DateTimeFormat(locale, opciones).format(fecha);
  }
}