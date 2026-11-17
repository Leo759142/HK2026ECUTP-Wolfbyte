/// <reference lib="webworker" />

type Entrada = {
	id: string;
	buffer: ArrayBuffer;
	type: string;
	maxSize: number;
	quality: number;
	mime?: string;
};

type Salida =
	| { id: string; type: 'done'; buffer: ArrayBuffer; mime: string }
	| { id: string; type: 'error'; message: string };

const worker = self as unknown as DedicatedWorkerGlobalScope;

async function blobConFallback(
	canvas: OffscreenCanvas,
	mime: string,
	quality: number
): Promise<Blob> {
	try {
		const blob = await canvas.convertToBlob({ type: mime, quality });
		// algunos navegadores ignoran el mime pedido y devuelven png; si pedimos webp/jpeg aceptamos el resultado
		if (blob && blob.size > 0) return blob;
	} catch {
		// fallback abajo
	}
	const fallback = mime === 'image/webp' ? 'image/jpeg' : 'image/webp';
	const blob = await canvas.convertToBlob({ type: fallback, quality });
	if (blob && blob.size > 0) return blob;
	return canvas.convertToBlob();
}

worker.onmessage = async ({ data }: MessageEvent<Entrada>) => {
	try {
		const bitmap = await createImageBitmap(new Blob([data.buffer], { type: data.type }), {
			imageOrientation: 'from-image'
		});
		const scale = Math.min(1, data.maxSize / Math.max(bitmap.width, bitmap.height));
		const canvas = new OffscreenCanvas(
			Math.max(1, Math.round(bitmap.width * scale)),
			Math.max(1, Math.round(bitmap.height * scale))
		);
		const context = canvas.getContext('2d');
		if (!context) throw new Error('No se pudo crear el contexto de imagen.');
		context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
		bitmap.close();
		const mime = data.mime ?? 'image/webp';
		const blob = await blobConFallback(canvas, mime, data.quality);
		const buffer = await blob.arrayBuffer();
		const message: Salida = { id: data.id, type: 'done', buffer, mime: blob.type || mime };
		worker.postMessage(message, [buffer]);
	} catch (cause) {
		const message: Salida = {
			id: data.id,
			type: 'error',
			message: cause instanceof Error ? cause.message : 'No se pudo procesar la imagen.'
		};
		worker.postMessage(message);
	}
};
