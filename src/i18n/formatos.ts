export type Idioma = 'es' | 'qu';

export class FormateadorComunitario {
  /**
   * Resuelve los plurales sin librerías externas pesadas.
   * Regla de negocio: En español hay dos formas (singular/plural), en quechua el plural es opcional o aglutinante (-kuna),
   * pero para la UI se mapea según el conteo de eventos de confianza.
   */
  static obtenerPluralVistosBuenos(conteo: number, idioma: Idioma): string {
    if (idioma === 'qu') {
      return conteo === 1 ? 'allin qawasqa' : `${conteo} allin qawasqakuna`;
    }
    return conteo === 1 ? '1 recomendado' : `${conteo} recomendados`;
  }

  /**
   * Formatea marcas de tiempo de forma segura, garantizando consistencia temporal.
   */
  static fechaCorta(fecha: Date, idioma: Idioma): string {
    const opciones: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
    return new Intl.DateTimeFormat(idioma === 'es' ? 'es-PE' : 'qu-PE', opciones).format(fecha);
  }
}