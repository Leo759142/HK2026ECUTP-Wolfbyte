export type TelefonoPeru = {
	departamento: string;
	capital?: string;
	lat: number;
	lng: number;
	telefonos: Array<{
		numero: string;
		nombre: string;
		tipo: 'bomberos' | 'policia' | 'samu' | 'serenazgo' | 'coer' | 'hospital';
	}>;
};

const CAPITALES: Record<string, { lat: number; lng: number }> = {
	Tumbes: { lat: -3.567, lng: -80.451 },
	Cajamarca: { lat: -7.157, lng: -78.522 },
	Loreto: { lat: -3.747, lng: -73.248 },
	Amazonas: { lat: -6.232, lng: -77.858 },
	Piura: { lat: -5.195, lng: -80.633 },
	Lambayeque: { lat: -6.768, lng: -79.841 },
	'La Libertad': { lat: -8.111, lng: -79.029 },
	Áncash: { lat: -9.574, lng: -77.526 },
	Ica: { lat: -14.065, lng: -75.732 },
	Ayacucho: { lat: -13.159, lng: -74.225 },
	Junín: { lat: -11.139, lng: -75.997 },
	Huánuco: { lat: -9.930, lng: -76.243 },
	Pasco: { lat: -10.683, lng: -75.262 },
	Ucayali: { lat: -8.379, lng: -74.559 },
	'Madre de Dios': { lat: -12.591, lng: -69.181 },
	Puno: { lat: -15.840, lng: -70.023 },
	Cusco: { lat: -13.519, lng: -71.977 },
	Apurímac: { lat: -13.614, lng: -73.432 },
	Tacna: { lat: -18.008, lng: -70.248 },
	Moquegua: { lat: -17.192, lng: -70.936 },
	Arequipa: { lat: -16.395, lng: -71.535 },
	Lima: { lat: -12.046, lng: -77.043 },
	Callao: { lat: -12.057, lng: -77.119 }
};
export const TELFONOS_POR_DEPARTAMENTO: TelefonoPeru[] = [
{
departamento: 'Tumbes',
capital: 'Tumbes',
...CAPITALES.Tumbes,
telefonos: [
{ numero: '956 203 270', nombre: 'Serenazgo Provincial de Tumbes', tipo: 'serenazgo' },
{ numero: '913 647 627', nombre: 'SAMU Tumbes (Central Móvil)', tipo: 'samu' },
{ numero: '072 523333', nombre: 'Compañía de Bomberos Tumbes N° 66', tipo: 'bomberos' },
{ numero: '072 522525', nombre: 'Comisaría PNP San José (Tumbes)', tipo: 'policia' },
{ numero: '989 805 223', nombre: 'Comisaría PNP Andrés Araujo Morán', tipo: 'policia' },
{ numero: '072 524823', nombre: 'Comisaría PNP El Tablazo', tipo: 'policia' },
{ numero: '072 523147', nombre: 'Comisaría PNP La Familia Tumbes', tipo: 'policia' }
]
},
{
departamento: 'Cajamarca',
capital: 'Cajamarca',
...CAPITALES.Cajamarca,
telefonos: [
{ numero: '076 361711', nombre: 'Compañía de Bomberos Cajamarca N° 59', tipo: 'bomberos' },
{ numero: '076 362650', nombre: 'Comisaría PNP Cajamarca (Central)', tipo: 'policia' },
{ numero: '076 363236', nombre: 'Serenazgo Provincial de Cajamarca', tipo: 'serenazgo' },
{ numero: '957 856 226', nombre: 'SAMU Cajamarca (Línea de Alerta Directa)', tipo: 'samu' },
{ numero: '076 584105', nombre: 'Hospital Regional de Cajamarca (Emergencias)', tipo: 'hospital' }
]
},
{
departamento: 'Loreto',
capital: 'Iquitos',
...CAPITALES.Loreto,
telefonos: [
{ numero: '065 233333', nombre: 'Compañía de Bomberos Iquitos N° 41', tipo: 'bomberos' },
{ numero: '065 241000', nombre: 'Central de Serenazgo de Maynas (Iquitos)', tipo: 'serenazgo' },
{ numero: '065 235313', nombre: 'Comisaría PNP Iquitos', tipo: 'policia' },
{ numero: '942 970 844', nombre: 'SAMU Loreto (Central de Urgencias)', tipo: 'samu' },
{ numero: '065 264353', nombre: 'Hospital Regional de Loreto (Emergencias)', tipo: 'hospital' }
]
},
{
departamento: 'Amazonas',
capital: 'Chachapoyas',
...CAPITALES.Amazonas,
telefonos: [
{ numero: '950 076 475', nombre: 'Serenazgo Provincial de Chachapoyas', tipo: 'serenazgo' },
{ numero: '980 750 002', nombre: 'SAMU Amazonas (Línea de Emergencias Médicas)', tipo: 'samu' },
{ numero: '964 773 832', nombre: 'Comisaría Sectorial PNP Chachapoyas', tipo: 'policia' },
{ numero: '947 004 499', nombre: 'Compañía de Bomberos Higos Urco N° 101', tipo: 'bomberos' },
{ numero: '997 451 269', nombre: 'COER Amazonas', tipo: 'coer' }
]
},
{
departamento: 'Piura',
capital: 'Piura',
...CAPITALES.Piura,
telefonos: [
{ numero: '950 206 506', nombre: 'Central de Serenazgo de Piura', tipo: 'serenazgo' },
{ numero: '989 174 242', nombre: 'SAMU Piura (Línea Móvil Directa)', tipo: 'samu' },
{ numero: '980 121 525', nombre: 'Comisaría PNP Piura (Central)', tipo: 'policia' },
{ numero: '073 309999', nombre: 'Compañía de Bomberos Piura N° 25', tipo: 'bomberos' },
{ numero: '957 881 252', nombre: 'Escuadrón Verde / Radio Patrulla PNP Piura', tipo: 'policia' }
]
},
{
departamento: 'Lambayeque',
capital: 'Chiclayo',
...CAPITALES.Lambayeque,
telefonos: [
{ numero: '978 794 101', nombre: 'Central de Emergencias Serenazgo Chiclayo', tipo: 'serenazgo' },
{ numero: '979 176 400', nombre: 'SAMU Lambayeque (Central Médica Directa)', tipo: 'samu' },
{ numero: '074 452997', nombre: 'Compañía de Bomberos Salvadora Chiclayo N° 27', tipo: 'bomberos' },
{ numero: '074 229697', nombre: 'Comisaría PNP Del Norte (Chiclayo)', tipo: 'policia' }
]
},
{
departamento: 'Lima',
capital: 'Lima',
...CAPITALES.Lima,
telefonos: [
{ numero: '105', nombre: 'Policía Nacional del Perú', tipo: 'policia' },
{ numero: '116', nombre: 'Bomberos Voluntarios del Perú', tipo: 'bomberos' },
{ numero: '106', nombre: 'SAMU (Servicio de Atención Móvil de Urgencia)', tipo: 'samu' },
{ numero: '942 383 839', nombre: 'COER Lima', tipo: 'coer' }
]
},
{
departamento: 'Callao',
capital: 'Callao',
...CAPITALES.Callao,
telefonos: [
{ numero: '105', nombre: 'Policía Nacional del Perú', tipo: 'policia' },
{ numero: '116', nombre: 'Bomberos Voluntarios del Perú', tipo: 'bomberos' },
{ numero: '106', nombre: 'SAMU (Servicio de Atención Móvil de Urgencia)', tipo: 'samu' },
{ numero: '942 383 839', nombre: 'COER Callao', tipo: 'coer' }
]
},
{
departamento: 'Arequipa',
capital: 'Arequipa',
...CAPITALES.Arequipa,
telefonos: [
{ numero: '105', nombre: 'Policía Nacional del Perú', tipo: 'policia' },
{ numero: '116', nombre: 'Bomberos Voluntarios del Perú', tipo: 'bomberos' },
{ numero: '106', nombre: 'SAMU (Servicio de Atención Móvil de Urgencia)', tipo: 'samu' }
]
},
{
departamento: 'Cusco',
capital: 'Cusco',
...CAPITALES.Cusco,
telefonos: [
{ numero: '105', nombre: 'Policía Nacional del Perú', tipo: 'policia' },
{ numero: '116', nombre: 'Bomberos Voluntarios del Perú', tipo: 'bomberos' },
{ numero: '106', nombre: 'SAMU (Servicio de Atención Móvil de Urgencia)', tipo: 'samu' },
{ numero: '942 383 839', nombre: 'COER Cusco', tipo: 'coer' }
]
},
{
departamento: 'Puno',
capital: 'Puno',
...CAPITALES.Puno,
telefonos: [
{ numero: '105', nombre: 'Policía Nacional del Perú', tipo: 'policia' },
{ numero: '116', nombre: 'Bomberos Voluntarios del Perú', tipo: 'bomberos' },
{ numero: '106', nombre: 'SAMU (Servicio de Atención Móvil de Urgencia)', tipo: 'samu' }
]
}
];

export function telefonosPorDepartamento(departamento: string): TelefonoPeru[] {
return TELFONOS_POR_DEPARTAMENTO.filter(
(d) => d.departamento.toLowerCase() === departamento.toLowerCase()
);
}

export function todosDepartamentos(): string[] {
return TELFONOS_POR_DEPARTAMENTO.map((d) => d.departamento);
}

export function telefonoWhatsApp(numero: string): string {
const digitos = numero.replace(/\s/g, '');
return `https://wa.me/${digitos}`;
}
