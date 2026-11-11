import type { Idioma } from '../tipos/tipos';

export type CategoriaInteres =
	| 'gasfiteria'
	| 'carpinteria'
	| 'electricidad'
	| 'cerrajeria'
	| 'clases'
	| 'paseo_mascotas'
	| 'comida'
	| 'costura'
	| 'reparaciones'
	| 'cuidado'
	| 'otro';

export interface PerfilPublicidad {
	usuarioId: string;
	zonaId: string;
	idioma: Idioma;
	categoriasInteres: CategoriaInteres[];
	esEmprendedor: boolean;
	abiertoANotificaciones: boolean;
}

export interface AnuncioCandidato {
	id: string;
	titulo: string;
	descripcion: string;
	zonaId: string;
	puntuacion: number;
	motivo: string;
}

export interface ReglaPuntuacion {
	nombre: string;
	peso: number;
	evaluar: (
		anuncio: {
			titulo: string;
			descripcion: string;
			zona_id: string;
			estado: string;
			inicio: string;
			fin: string | null;
		},
		perfil: PerfilPublicidad,
		ahora: Date
	) => number;
}

const PALABRAS_CATEGORIA: Record<CategoriaInteres, string[]> = {
	gasfiteria: ['agua', 'fuga', 'grifo', 'tubería', 'desatoro'],
	carpinteria: ['madera', 'puerta', 'ventana', 'mueble', 'estante'],
	electricidad: ['luz', 'enchufe', 'cable', 'interruptor', 'voltaje'],
	cerrajeria: ['cerrojo', 'llave', 'candado', 'cerradura'],
	clases: ['clase', 'curso', 'tutoría', 'enseñar'],
	paseo_mascotas: ['perro', 'gato', 'paseo', 'mascota'],
	comida: ['comida', 'cocinar', 'menú', 'almuerzo'],
	costura: ['coser', 'tela', 'ajuste', 'orilla'],
	reparaciones: ['reparar', 'arreglo', 'mantenimiento'],
	cuidado: ['cuidado', 'niño', 'adulto mayor', 'acompañar'],
	otro: []
};

function coincideCategoria(
	anuncio: { titulo: string; descripcion: string },
	categoria: CategoriaInteres
): boolean {
	const texto = `${anuncio.titulo} ${anuncio.descripcion}`.toLowerCase();
	return PALABRAS_CATEGORIA[categoria].some((palabra) => texto.includes(palabra.toLowerCase()));
}

export const REGLAS_PUBLICIDAD: ReglaPuntuacion[] = [
	{
		nombre: 'vigencia_y_estado',
		peso: 40,
		evaluar: (anuncio, _perfil, ahora) => {
			const t = ahora.toISOString();
			if (anuncio.estado !== 'aprobado') return 0;
			if (anuncio.inicio > t) return 0;
			if (anuncio.fin && anuncio.fin < t) return 0;
			return 40;
		}
	},
	{
		nombre: 'zona_coincidente',
		peso: 30,
		evaluar: (anuncio, perfil) => (anuncio.zona_id === perfil.zonaId ? 30 : 0)
	},
	{
		nombre: 'categoria_de_interes',
		peso: 20,
		evaluar: (anuncio, perfil) => {
			const mejor = perfil.categoriasInteres.some((c) => coincideCategoria(anuncio, c));
			return mejor ? 20 : 0;
		}
	},
	{
		nombre: 'perfil_emprendedor',
		peso: 10,
		evaluar: (_anuncio, perfil) => (perfil.esEmprendedor ? 10 : 0)
	}
];

export function esAnuncioElegible(
	anuncio: { estado: string; inicio: string; fin: string | null },
	ahora: Date = new Date()
): boolean {
	if (anuncio.estado !== 'aprobado') return false;
	const t = ahora.toISOString();
	if (anuncio.inicio > t) return false;
	if (anuncio.fin && anuncio.fin < t) return false;
	return true;
}

export function puntuarAnuncio(
	anuncio: {
		id: string;
		titulo: string;
		descripcion: string;
		zona_id: string;
		estado: string;
		inicio: string;
		fin: string | null;
	},
	perfil: PerfilPublicidad,
	reglas: ReglaPuntuacion[] = REGLAS_PUBLICIDAD,
	ahora: Date = new Date()
): AnuncioCandidato {
	if (!esAnuncioElegible(anuncio, ahora)) {
		return {
			id: anuncio.id,
			titulo: anuncio.titulo,
			descripcion: anuncio.descripcion,
			zonaId: anuncio.zona_id,
			puntuacion: 0,
			motivo: 'no elegible'
		};
	}
	let puntuacion = 0;
	const motivos: string[] = [];
	for (const regla of reglas) {
		const parcial = regla.evaluar(anuncio, perfil, ahora);
		if (parcial > 0) {
			puntuacion += parcial;
			motivos.push(`${regla.nombre}: +${parcial}`);
		}
	}
	return {
		id: anuncio.id,
		titulo: anuncio.titulo,
		descripcion: anuncio.descripcion,
		zonaId: anuncio.zona_id,
		puntuacion,
		motivo: motivos.join(' · ') || 'sin coincidencia'
	};
}

export function seleccionarAnuncio(
	anuncios: Array<{
		id: string;
		titulo: string;
		descripcion: string;
		zona_id: string;
		estado: string;
		inicio: string;
		fin: string | null;
	}>,
	perfil: PerfilPublicidad,
	reglas: ReglaPuntuacion[] = REGLAS_PUBLICIDAD,
	ahora: Date = new Date()
): AnuncioCandidato | null {
	const puntuados = anuncios.map((a) => puntuarAnuncio(a, perfil, reglas, ahora));
	const validos = puntuados.filter((p) => p.puntuacion > 0);
	if (validos.length === 0) return null;
	validos.sort((a, b) => b.puntuacion - a.puntuacion);
	return validos[0];
}

export function perfilVacio(usuarioId: string, zonaId: string, idioma: Idioma): PerfilPublicidad {
	return {
		usuarioId,
		zonaId,
		idioma,
		categoriasInteres: [],
		esEmprendedor: false,
		abiertoANotificaciones: false
	};
}
