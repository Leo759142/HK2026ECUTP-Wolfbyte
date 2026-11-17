import { comprimirImagenEnWorker } from '../workers/image';
import {
	crearIdImagen,
	crearPreview,
	esTipoImagenAceptado,
	liberarImagen,
	REGLAS_IMAGEN_DEFECTO,
	type ImagenMeta,
	type ImagenNormalizada,
	type ImagenOrigen,
	type RechazoImagen,
	type ReglasImagen,
	type ResultadoProcesamiento
} from './tipos';

export { liberarImagen, revocarPreview } from './tipos';
export type { ImagenMeta, ImagenNormalizada, ImagenOrigen, RechazoImagen, ReglasImagen, ResultadoProcesamiento };

function tamanoLegible(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${Math.round(bytes / 102.4) / 10} KB`;
	return `${Math.round(bytes / 104857.6) / 10} MB`;
}

function dataUrlABlob(dataUrl: string): Blob | null {
	const match = /^data:([^;,]+)?(?:;base64)?,(.*)$/i.exec(dataUrl);
	if (!match) return null;
	const mime = match[1] || 'application/octet-stream';
	const data = match[2] || '';
	try {
		if (/;base64,/i.test(dataUrl)) {
			const bin = atob(data);
			const bytes = new Uint8Array(bin.length);
			for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
			return new Blob([bytes], { type: mime });
		}
		return new Blob([decodeURIComponent(data)], { type: mime });
	} catch {
		return null;
	}
}

function tamanoDataUrl(dataUrl: string): number {
	const blob = dataUrlABlob(dataUrl);
	if (blob) return blob.size;
	const base64 = dataUrl.split(',')[1] || '';
	return Math.floor((base64.length * 3) / 4);
}

function leerDimensiones(file: File): Promise<{ width?: number; height?: number }> {
	return new Promise((resolve) => {
		if (typeof Image === 'undefined') return resolve({});
		const url = crearPreview(file);
		if (!url) return resolve({});
		const image = new Image();
		image.onload = () => {
			const dims = { width: image.naturalWidth || image.width, height: image.naturalHeight || image.height };
			if (typeof URL !== 'undefined') {
				try { URL.revokeObjectURL(url); } catch {}
			}
			resolve(dims);
		};
		image.onerror = () => {
			if (typeof URL !== 'undefined') {
				try { URL.revokeObjectURL(url); } catch {}
			}
			resolve({});
		};
		image.src = url;
	});
}

function comprimirEnHiloPrincipal(file: File, reglas: ReglasImagen): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
		reader.onload = () => {
			const image = new Image();
			image.onerror = () => reject(new Error('La imagen no es válida o no es compatible.'));
			image.onload = async () => {
				try {
					const scale = Math.min(1, reglas.maxLado / Math.max(image.width, image.height));
					const width = Math.max(1, Math.round(image.width * scale));
					const height = Math.max(1, Math.round(image.height * scale));
					const canvas = document.createElement('canvas');
					canvas.width = width;
					canvas.height = height;
					const context = canvas.getContext('2d');
					if (!context) return reject(new Error('No se pudo procesar la imagen.'));
					context.drawImage(image, 0, 0, width, height);
					const tope = reglas.maxBytesSalida ?? Infinity;
					const calidades = [reglas.calidad, 0.72, 0.62, 0.52, 0.42];
					let salida = '';
					for (const q of calidades) {
						salida = canvas.toDataURL('image/jpeg', q);
						if (tamanoDataUrl(salida) <= tope) break;
					}
					if (tamanoDataUrl(salida) > tope) {
						reject(new Error(`La imagen supera ${tamanoLegible(tope)} incluso después de optimizarla.`));
						return;
					}
					resolve(salida);
				} catch {
					reject(new Error('No se pudo procesar la imagen.'));
				}
			};
			image.src = String(reader.result);
		};
		reader.readAsDataURL(file);
	});
}

async function normalizar(file: File, reglas: ReglasImagen): Promise<string> {
	const tope = reglas.maxBytesSalida ?? Infinity;
	const calidades = Array.from(new Set([reglas.calidad, 0.72, 0.62, 0.52, 0.42])).filter((q) => q > 0 && q <= 1);
	try {
		for (const quality of calidades) {
			const dataUrl = await comprimirImagenEnWorker(file, reglas.maxLado, quality);
			if (tamanoDataUrl(dataUrl) <= tope) return dataUrl;
		}
	} catch {
		// fallback abajo
	}
	return comprimirEnHiloPrincipal(file, reglas);
}

export function archivosDesdeDataTransfer(data: DataTransfer | null): File[] {
	if (!data) return [];
	const items = data.items ? Array.from(data.items) : [];
	const desdeItems = items
		.filter((item) => item.kind === 'file')
		.map((item) => item.getAsFile())
		.filter((file): file is File => Boolean(file));
	if (desdeItems.length) return desdeItems;
	return data.files ? Array.from(data.files) : [];
}

export function archivosDesdeClipboard(data: DataTransfer | null): File[] {
	const files = archivosDesdeDataTransfer(data);
	if (files.length) return files;
	return [];
}

export async function procesarArchivos(
	entradas: File[] | FileList | null | undefined,
	opciones: {
		reglas?: Partial<ReglasImagen>;
		actuales?: number;
		origen?: ImagenOrigen;
	} = {}
): Promise<ResultadoProcesamiento> {
	const reglas: ReglasImagen = { ...REGLAS_IMAGEN_DEFECTO, ...(opciones.reglas ?? {}) };
	const origen = opciones.origen ?? 'seleccion';
	const actuales = opciones.actuales ?? 0;
	const lista = entradas ? Array.from(entradas as ArrayLike<File>) : [];
	const aceptadas: ImagenNormalizada[] = [];
	const rechazos: RechazoImagen[] = [];
	const cupo = Math.max(0, reglas.maxArchivos - actuales);

	for (const file of lista) {
		const nombre = file.name || 'imagen';
		if (!esTipoImagenAceptado(file, reglas.acceptTipos) && !file.type.startsWith('image/')) {
			rechazos.push({ archivo: nombre, codigo: 'tipo', mensaje: 'Selecciona un archivo de imagen válido.' });
			continue;
		}
		if (file.size > reglas.maxBytesEntrada) {
			rechazos.push({
				archivo: nombre,
				codigo: 'tamano',
				mensaje: `La imagen no puede superar ${tamanoLegible(reglas.maxBytesEntrada)}.`
			});
			continue;
		}
		if (aceptadas.length >= cupo) {
			rechazos.push({
				archivo: nombre,
				codigo: 'cupo',
				mensaje:
					reglas.maxArchivos === 1
						? 'Solo puedes agregar 1 imagen.'
						: `Puedes agregar como máximo ${reglas.maxArchivos} imágenes.`
			});
			continue;
		}
		try {
			const dims = await leerDimensiones(file);
			const dataUrl = await normalizar(file, reglas);
			const sizeNormalizado = tamanoDataUrl(dataUrl);
			if (reglas.maxBytesSalida && sizeNormalizado > reglas.maxBytesSalida) {
				rechazos.push({
					archivo: nombre,
					codigo: 'salida',
					mensaje: `La imagen supera ${tamanoLegible(reglas.maxBytesSalida)} incluso después de optimizarla.`
				});
				continue;
			}
			const previewUrl = crearPreview(file);
			const mimeNormalizado = /^data:([^;,]+)/i.exec(dataUrl)?.[1];
			const meta: ImagenMeta = {
				id: crearIdImagen(),
				name: nombre,
				sizeOriginal: file.size,
				typeOriginal: file.type || 'image/*',
				lastModified: file.lastModified || Date.now(),
				origen,
				width: dims.width,
				height: dims.height,
				mimeNormalizado,
				sizeNormalizado
			};
			aceptadas.push({ meta, dataUrl, previewUrl });
		} catch (cause) {
			rechazos.push({
				archivo: nombre,
				codigo: 'proceso',
				mensaje: cause instanceof Error ? cause.message : 'No se pudo procesar la imagen.'
			});
		}
	}

	return { aceptadas, rechazos };
}

export function aValorSimple(imagen?: ImagenNormalizada | null): string | null {
	return imagen?.dataUrl ?? null;
}

export function desdeValorSimple(value: string | null | undefined): ImagenNormalizada | null {
	if (!value) return null;
	return {
		meta: {
			id: crearIdImagen(),
			name: 'imagen',
			sizeOriginal: 0,
			typeOriginal: 'image/*',
			lastModified: Date.now(),
			origen: 'seleccion'
		},
		dataUrl: value
	};
}
