export type ImagenOrigen = 'seleccion' | 'drop' | 'paste' | 'camara';

export interface ImagenMeta {
	id: string;
	name: string;
	sizeOriginal: number;
	typeOriginal: string;
	lastModified: number;
	origen: ImagenOrigen;
	width?: number;
	height?: number;
	mimeNormalizado?: string;
	sizeNormalizado?: number;
}

export interface ImagenNormalizada {
	meta: ImagenMeta;
	/** Valor persistido compatible con el contrato actual (data URL) */
	dataUrl: string;
	/** URL efímera para preview rápida; debe revocarse con liberarImagen */
	previewUrl?: string;
}

export interface ReglasImagen {
	maxArchivos: number;
	maxBytesEntrada: number;
	maxBytesSalida?: number;
	acceptTipos: string[];
	maxLado: number;
	calidad: number;
}

export interface RechazoImagen {
	archivo: string;
	codigo: 'tipo' | 'tamano' | 'cupo' | 'lectura' | 'proceso' | 'salida';
	mensaje: string;
}

export interface ResultadoProcesamiento {
	aceptadas: ImagenNormalizada[];
	rechazos: RechazoImagen[];
}

export const REGLAS_IMAGEN_DEFECTO: ReglasImagen = {
	maxArchivos: 1,
	maxBytesEntrada: 5 * 1024 * 1024,
	maxBytesSalida: 5 * 1024 * 1024,
	acceptTipos: ['image/', 'application/pdf', '.jpg', '.jpeg', '.png', '.webp'],
	maxLado: 1280,
	calidad: 0.8
};

export function crearIdImagen(): string {
	return typeof crypto !== 'undefined' && 'randomUUID' in crypto
		? crypto.randomUUID()
		: `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function esTipoImagenAceptado(file: File, acceptTipos = REGLAS_IMAGEN_DEFECTO.acceptTipos): boolean {
	return acceptTipos.some((tipo) =>
		tipo.endsWith('/') ? file.type.startsWith(tipo) : file.type === tipo
	);
}

export function crearPreview(file: Blob): string | undefined {
	if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') return undefined;
	try {
		return URL.createObjectURL(file);
	} catch {
		return undefined;
	}
}

export function revocarPreview(url?: string | null): void {
	if (!url || typeof URL === 'undefined' || typeof URL.revokeObjectURL !== 'function') return;
	if (url.startsWith('blob:')) {
		try {
			URL.revokeObjectURL(url);
		} catch {
			// noop
		}
	}
}

export function liberarImagen(imagen?: Pick<ImagenNormalizada, 'previewUrl'> | null): void {
	if (!imagen) return;
	revocarPreview(imagen.previewUrl);
}
