/// <reference lib="webworker" />

type Entrada = {
	id: string;
	buffer: ArrayBuffer;
	type: string;
	maxSize: number;
	quality: number;
};

type Salida =
	| { id: string; type: 'done'; buffer: ArrayBuffer; mime: string }
	| { id: string; type: 'error'; message: string };

const worker = self as unknown as DedicatedWorkerGlobalScope;

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
		const blob = await canvas.convertToBlob({ type: 'image/webp', quality: data.quality });
		const buffer = await blob.arrayBuffer();
		const message: Salida = { id: data.id, type: 'done', buffer, mime: 'image/webp' };
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
