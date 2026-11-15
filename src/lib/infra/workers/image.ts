function dataUrl(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onerror = () => reject(new Error('No se pudo leer la imagen procesada.'));
		reader.onload = () => resolve(String(reader.result));
		reader.readAsDataURL(blob);
	});
}

export async function comprimirImagenEnWorker(
	file: File,
	maxSize = 480,
	quality = 0.72
): Promise<string> {
	if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined')
		throw new Error('Este navegador no admite procesamiento de imágenes en segundo plano.');

	const worker = new Worker(new URL('./image.worker.ts', import.meta.url), { type: 'module' });
	try {
		const id = crypto.randomUUID();
		const buffer = await file.arrayBuffer();
		const result = await new Promise<{ buffer: ArrayBuffer; mime: string }>((resolve, reject) => {
			worker.onmessage = (
				event: MessageEvent<{
					id: string;
					type: string;
					buffer?: ArrayBuffer;
					mime?: string;
					message?: string;
				}>
			) => {
				if (event.data.id !== id) return;
				if (event.data.type === 'error') reject(new Error(event.data.message));
				else if (event.data.buffer && event.data.mime)
					resolve({ buffer: event.data.buffer, mime: event.data.mime });
			};
			worker.onerror = () => reject(new Error('No se pudo iniciar el procesador de imágenes.'));
			worker.postMessage({ id, buffer, type: file.type, maxSize, quality }, [buffer]);
		});
		return dataUrl(new Blob([result.buffer], { type: result.mime }));
	} finally {
		worker.terminate();
	}
}
