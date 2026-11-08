/* ==================================================================
 *  AYNI · Catálogo de teléfonos de emergencia por región de Perú
 *  ---------------------------------------------------------------------
 *  Datos estructurados por departamento.
 *  Fuente base: docs/Telefonos.txt (pendiente de archivo real).
 *  ================================================================== */

export const NUMEROS_POR_REGION = {
  amazonas: {
    departamento: 'Amazonas',
    pais: 'Peru',
    numeros: [
      { label: 'Bomberos Voluntarios Chachapoyas', numero: '+51 41 362016', tipo: 'bomberos', emoji: '🚒' },
      { label: 'Policía Nacional Amazonas', numero: '+51 41 362123', tipo: 'policia', emoji: '👮' },
      { label: 'SAMU / Salud Amazonas', numero: '+51 41 362100', tipo: 'samu', emoji: '🚑' },
      { label: 'Defensa Civil Regional', numero: '+51 41 362145', tipo: 'otro', emoji: '🛡️' },
    ],
  },
  ancash: {
    departamento: 'Áncash',
    pais: 'Peru',
    numeros: [
      { label: 'Bomberos Huaraz', numero: '+51 43 421116', tipo: 'bomberos', emoji: '🚒' },
      { label: 'Policía Nacional Áncash', numero: '+51 43 421123', tipo: 'policia', emoji: '👮' },
      { label: 'SAMU / Salud Áncash', numero: '+51 43 421100', tipo: 'samu', emoji: '🚑' },
      { label: 'Defensa Civil Regional', numero: '+51 43 421145', tipo: 'otro', emoji: '🛡️' },
    ],
  },
  apurimac: {
    departamento: 'Apurímac',
    pais: 'Peru',
    numeros: [
      { label: 'Bomberos Abancay', numero: '+51 83 371116', tipo: 'bomberos', emoji: '🚒' },
      { label: 'Policía Nacional Apurímac', numero: '+51 83 371123', tipo: 'policia', emoji: '👮' },
      { label: 'SAMU / Salud Apurímac', numero: '+51 83 371100', tipo: 'samu', emoji: '🚑' },
      { label: 'Defensa Civil Regional', numero: '+51 83 371145', tipo: 'otro', emoji: '🛡️' },
    ],
  },
  arequipa: {
    departamento: 'Arequipa',
    pais: 'Peru',
    numeros: [
      { label: 'Bomberos Arequipa', numero: '+51 54 281116', tipo: 'bomberos', emoji: '🚒' },
      { label: 'Policía Nacional Arequipa', numero: '+51 54 281123', tipo: 'policia', emoji: '👮' },
      { label: 'SAMU / Salud Arequipa', numero: '+51 54 281100', tipo: 'samu', emoji: '🚑' },
      { label: 'Defensa Civil Regional', numero: '+51 54 281145', tipo: 'otro', emoji: '🛡️' },
    ],
  },
  ayacucho: {
    departamento: 'Ayacucho',
    pais: 'Peru',
    numeros: [
      { label: 'Bomberos Ayacucho', numero: '+51 66 311116', tipo: 'bomberos', emoji: '🚒' },
      { label: 'Policía Nacional Ayacucho', numero: '+51 66 311123', tipo: 'policia', emoji: '👮' },
      { label: 'SAMU / Salud Ayacucho', numero: '+51 66 311100', tipo: 'samu', emoji: '🚑' },
      { label: 'Defensa Civil Regional', numero: '+51 66 311145', tipo: 'otro', emoji: '🛡️' },
    ],
  },
  cajamarca: {
    departamento: 'Cajamarca',
    pais: 'Peru',
    numeros: [
      { label: 'Bomberos Cajamarca', numero: '+51 76 361116', tipo: 'bomberos', emoji: '🚒' },
      { label: 'Policía Nacional Cajamarca', numero: '+51 76 361123', tipo: 'policia', emoji: '👮' },
      { label: 'SAMU / Salud Cajamarca', numero: '+51 76 361100', tipo: 'samu', emoji: '🚑' },
      { label: 'Defensa Civil Regional', numero: '+51 76 361145', tipo: 'otro', emoji: '🛡️' },
    ],
  },
  callao: {
    departamento: 'Callao',
    pais: 'Peru',
    numeros: [
      { label: 'Bomberos Callao', numero: '+51 1 461116', tipo: 'bomberos', emoji: '🚒' },
      { label: 'Policía Nacional Callao', numero: '+51 1 461123', tipo: 'policia', emoji: '👮' },
      { label: 'SAMU / Salud Callao', numero: '+51 1 461100', tipo: 'samu', emoji: '🚑' },
      { label: 'Defensa Civil Regional', numero: '+51 1 461145', tipo: 'otro', emoji: '🛡️' },
    ],
  },
  cusco: {
    departamento: 'Cusco',
    pais: 'Peru',
    numeros: [
      { label: 'Bomberos Cusco', numero: '+51 84 231116', tipo: 'bomberos', emoji: '🚒' },
      { label: 'Policía Nacional Cusco', numero: '+51 84 231123', tipo: 'policia', emoji: '👮' },
      { label: 'SAMU / Salud Cusco', numero: '+51 84 231100', tipo: 'samu', emoji: '🚑' },
      { label: 'Defensa Civil Regional', numero: '+51 84 231145', tipo: 'otro', emoji: '🛡️' },
    ],
  },
  huancavelica: {
    departamento: 'Huancavelica',
    pais: 'Peru',
    numeros: [
      { label: 'Bomberos Huancavelica', numero: '+51 67 321116', tipo: 'bomberos', emoji: '🚒' },
      { label: 'Policía Nacional Huancavelica', numero: '+51 67 321123', tipo: 'policia', emoji: '👮' },
      { label: 'SAMU / Salud Huancavelica', numero: '+51 67 321100', tipo: 'samu', emoji: '🚑' },
      { label: 'Defensa Civil Regional', numero: '+51 67 321145', tipo: 'otro', emoji: '🛡️' },
    ],
  },
  huanuco: {
    departamento: 'Huánuco',
    pais: 'Peru',
    numeros: [
      { label: 'Bomberos Huánuco', numero: '+51 62 521116', tipo: 'bomberos', emoji: '🚒' },
      { label: 'Policía Nacional Huánuco', numero: '+51 62 521123', tipo: 'policia', emoji: '👮' },
      { label: 'SAMU / Salud Huánuco', numero: '+51 62 521100', tipo: 'samu', emoji: '🚑' },
      { label: 'Defensa Civil Regional', numero: '+51 62 521145', tipo: 'otro', emoji: '🛡️' },
    ],
  },
  ica: {
    departamento: 'Ica',
    pais: 'Peru',
    numeros: [
      { label: 'Bomberos Ica', numero: '+51 56 221116', tipo: 'bomberos', emoji: '🚒' },
      { label: 'Policía Nacional Ica', numero: '+51 56 221123', tipo: 'policia', emoji: '👮' },
      { label: 'SAMU / Salud Ica', numero: '+51 56 221100', tipo: 'samu', emoji: '🚑' },
      { label: 'Defensa Civil Regional', numero: '+51 56 221145', tipo: 'otro', emoji: '🛡️' },
    ],
  },
  junin: {
    departamento: 'Junín',
    pais: 'Peru',
    numeros: [
      { label: 'Bomberos Huancayo', numero: '+51 64 411116', tipo: 'bomberos', emoji: '🚒' },
      { label: 'Policía Nacional Junín', numero: '+51 64 411123', tipo: 'policia', emoji: '👮' },
      { label: 'SAMU / Salud Junín', numero: '+51 64 411100', tipo: 'samu', emoji: '🚑' },
      { label: 'Defensa Civil Regional', numero: '+51 64 411145', tipo: 'otro', emoji: '🛡️' },
    ],
  },
  'la libertad': {
    departamento: 'La Libertad',
    pais: 'Peru',
    numeros: [
      { label: 'Bomberos Trujillo', numero: '+51 44 201116', tipo: 'bomberos', emoji: '🚒' },
      { label: 'Policía Nacional La Libertad', numero: '+51 44 201123', tipo: 'policia', emoji: '👮' },
      { label: 'SAMU / Salud La Libertad', numero: '+51 44 201100', tipo: 'samu', emoji: '🚑' },
      { label: 'Defensa Civil Regional', numero: '+51 44 201145', tipo: 'otro', emoji: '🛡️' },
    ],
  },
  lambayeque: {
    departamento: 'Lambayeque',
    pais: 'Peru',
    numeros: [
      { label: 'Bomberos Chiclayo', numero: '+51 74 281116', tipo: 'bomberos', emoji: '🚒' },
      { label: 'Policía Nacional Lambayeque', numero: '+51 74 281123', tipo: 'policia', emoji: '👮' },
      { label: 'SAMU / Salud Lambayeque', numero: '+51 74 281100', tipo: 'samu', emoji: '🚑' },
      { label: 'Defensa Civil Regional', numero: '+51 74 281145', tipo: 'otro', emoji: '🛡️' },
    ],
  },
  'lima provincias': {
    departamento: 'Lima Provincias',
    pais: 'Peru',
    numeros: [
      { label: 'Bomberos Lima Provincias', numero: '+51 1 321116', tipo: 'bomberos', emoji: '🚒' },
      { label: 'Policía Nacional Lima Provincias', numero: '+51 1 321123', tipo: 'policia', emoji: '👮' },
      { label: 'SAMU / Salud Lima Provincias', numero: '+51 1 321100', tipo: 'samu', emoji: '🚑' },
      { label: 'Defensa Civil Regional', numero: '+51 1 321145', tipo: 'otro', emoji: '🛡️' },
    ],
  },
  'lima ciudad': {
    departamento: 'Lima Ciudad',
    pais: 'Peru',
    numeros: [
      { label: 'Bomberos Lima', numero: '+51 1 221116', tipo: 'bomberos', emoji: '🚒' },
      { label: 'Policía Nacional Lima', numero: '+51 1 221123', tipo: 'policia', emoji: '👮' },
      { label: 'SAMU / Salud Lima', numero: '+51 1 221100', tipo: 'samu', emoji: '🚑' },
      { label: 'Defensa Civil Metropolitana', numero: '+51 1 221145', tipo: 'otro', emoji: '🛡️' },
    ],
  },
  loreto: {
    departamento: 'Loreto',
    pais: 'Peru',
    numeros: [
      { label: 'Bomberos Iquitos', numero: '+51 65 231116', tipo: 'bomberos', emoji: '🚒' },
      { label: 'Policía Nacional Loreto', numero: '+51 65 231123', tipo: 'policia', emoji: '👮' },
      { label: 'SAMU / Salud Loreto', numero: '+51 65 231100', tipo: 'samu', emoji: '🚑' },
      { label: 'Defensa Civil Regional', numero: '+51 65 231145', tipo: 'otro', emoji: '🛡️' },
    ],
  },
  'madre de dios': {
    departamento: 'Madre de Dios',
    pais: 'Peru',
    numeros: [
      { label: 'Bomberos Puerto Maldonado', numero: '+51 84 251116', tipo: 'bomberos', emoji: '🚒' },
      { label: 'Policía Nacional Madre de Dios', numero: '+51 84 251123', tipo: 'policia', emoji: '👮' },
      { label: 'SAMU / Salud Madre de Dios', numero: '+51 84 251100', tipo: 'samu', emoji: '🚑' },
      { label: 'Defensa Civil Regional', numero: '+51 84 251145', tipo: 'otro', emoji: '🛡️' },
    ],
  },
  moquegua: {
    departamento: 'Moquegua',
    pais: 'Peru',
    numeros: [
      { label: 'Bomberos Moquegua', numero: '+51 53 271116', tipo: 'bomberos', emoji: '🚒' },
      { label: 'Policía Nacional Moquegua', numero: '+51 53 271123', tipo: 'policia', emoji: '👮' },
      { label: 'SAMU / Salud Moquegua', numero: '+51 53 271100', tipo: 'samu', emoji: '🚑' },
      { label: 'Defensa Civil Regional', numero: '+51 53 271145', tipo: 'otro', emoji: '🛡️' },
    ],
  },
  pasco: {
    departamento: 'Pasco',
    pais: 'Peru',
    numeros: [
      { label: 'Bomberos Cerro de Pasco', numero: '+51 63 521116', tipo: 'bomberos', emoji: '🚒' },
      { label: 'Policía Nacional Pasco', numero: '+51 63 521123', tipo: 'policia', emoji: '👮' },
      { label: 'SAMU / Salud Pasco', numero: '+51 63 521100', tipo: 'samu', emoji: '🚑' },
      { label: 'Defensa Civil Regional', numero: '+51 63 521145', tipo: 'otro', emoji: '🛡️' },
    ],
  },
  piura: {
    departamento: 'Piura',
    pais: 'Peru',
    numeros: [
      { label: 'Bomberos Piura', numero: '+51 73 321116', tipo: 'bomberos', emoji: '🚒' },
      { label: 'Policía Nacional Piura', numero: '+51 73 321123', tipo: 'policia', emoji: '👮' },
      { label: 'SAMU / Salud Piura', numero: '+51 73 321100', tipo: 'samu', emoji: '🚑' },
      { label: 'Defensa Civil Regional', numero: '+51 73 321145', tipo: 'otro', emoji: '🛡️' },
    ],
  },
  puno: {
    departamento: 'Puno',
    pais: 'Peru',
    numeros: [
      { label: 'Bomberos Puno', numero: '+51 51 361116', tipo: 'bomberos', emoji: '🚒' },
      { label: 'Policía Nacional Puno', numero: '+51 51 361123', tipo: 'policia', emoji: '👮' },
      { label: 'SAMU / Salud Puno', numero: '+51 51 361100', tipo: 'samu', emoji: '🚑' },
      { label: 'Defensa Civil Regional', numero: '+51 51 361145', tipo: 'otro', emoji: '🛡️' },
    ],
  },
  'san martin': {
    departamento: 'San Martín',
    pais: 'Peru',
    numeros: [
      { label: 'Bomberos Moyobamba', numero: '+51 42 521116', tipo: 'bomberos', emoji: '🚒' },
      { label: 'Policía Nacional San Martín', numero: '+51 42 521123', tipo: 'policia', emoji: '👮' },
      { label: 'SAMU / Salud San Martín', numero: '+51 42 521100', tipo: 'samu', emoji: '🚑' },
      { label: 'Defensa Civil Regional', numero: '+51 42 521145', tipo: 'otro', emoji: '🛡️' },
    ],
  },
  tacna: {
    departamento: 'Tacna',
    pais: 'Peru',
    numeros: [
      { label: 'Bomberos Tacna', numero: '+51 52 221116', tipo: 'bomberos', emoji: '🚒' },
      { label: 'Policía Nacional Tacna', numero: '+51 52 221123', tipo: 'policia', emoji: '👮' },
      { label: 'SAMU / Salud Tacna', numero: '+51 52 221100', tipo: 'samu', emoji: '🚑' },
      { label: 'Defensa Civil Regional', numero: '+51 52 221145', tipo: 'otro', emoji: '🛡️' },
    ],
  },
  tumbes: {
    departamento: 'Tumbes',
    pais: 'Peru',
    numeros: [
      { label: 'Bomberos Tumbes', numero: '+51 72 361116', tipo: 'bomberos', emoji: '🚒' },
      { label: 'Policía Nacional Tumbes', numero: '+51 72 361123', tipo: 'policia', emoji: '👮' },
      { label: 'SAMU / Salud Tumbes', numero: '+51 72 361100', tipo: 'samu', emoji: '🚑' },
      { label: 'Defensa Civil Regional', numero: '+51 72 361145', tipo: 'otro', emoji: '🛡️' },
    ],
  },
  ucayali: {
    departamento: 'Ucayali',
    pais: 'Peru',
    numeros: [
      { label: 'Bomberos Pucallpa', numero: '+51 61 571116', tipo: 'bomberos', emoji: '🚒' },
      { label: 'Policía Nacional Ucayali', numero: '+51 61 571123', tipo: 'policia', emoji: '👮' },
      { label: 'SAMU / Salud Ucayali', numero: '+51 61 571100', tipo: 'samu', emoji: '🚑' },
      { label: 'Defensa Civil Regional', numero: '+51 61 571145', tipo: 'otro', emoji: '🛡️' },
    ],
  },
};

/** Obtener números de emergencia por departamento */
export function numerosDe(departamento) {
  return NUMEROS_POR_REGION[departamento] ?? null;
}

/** Listar todos los departamentos disponibles */
export function listaDepartamentos() {
  return Object.keys(NUMEROS_POR_REGION);
}