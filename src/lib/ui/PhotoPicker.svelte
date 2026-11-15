<script lang="ts">
	import { comprimirImagenEnWorker } from '../infra/workers/image';
	interface Props {
		value?: string | null;
		onchange?: (value: string | null) => void;
		values?: string[];
		onvalueschange?: (values: string[]) => void;
		multiple?: boolean;
	}

	let { value = null, onchange, values = [], onvalueschange, multiple = false }: Props = $props();
	let error = $state('');

	function comprimirEnHiloPrincipal(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
			reader.onload = () => {
				const image = new Image();
				image.onerror = () => reject(new Error('La imagen no es válida.'));
				image.onload = () => {
					const scale = Math.min(1, 480 / Math.max(image.width, image.height));
					const canvas = document.createElement('canvas');
					canvas.width = Math.max(1, Math.round(image.width * scale));
					canvas.height = Math.max(1, Math.round(image.height * scale));
					const context = canvas.getContext('2d');
					if (!context) return reject(new Error('No se pudo procesar la imagen.'));
					context.drawImage(image, 0, 0, canvas.width, canvas.height);
					resolve(canvas.toDataURL('image/jpeg', 0.72));
				};
				image.src = String(reader.result);
			};
			reader.readAsDataURL(file);
		});
	}

	async function comprimir(file: File): Promise<string> {
		try {
			return await comprimirImagenEnWorker(file);
		} catch {
			return comprimirEnHiloPrincipal(file);
		}
	}

	async function elegir(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		error = '';
		try {
			if (!file.type.startsWith('image/')) {
				throw new Error('Selecciona un archivo de imagen válido.');
			}
			if (file.size > 10 * 1024 * 1024) {
				throw new Error('La imagen no puede superar 10 MB.');
			}
			const imagen = await comprimir(file);
			if (multiple && onvalueschange) {
				if (values.length >= 3) throw new Error('Puedes agregar como máximo 3 fotos.');
				onvalueschange([...values, imagen]);
			} else {
				onchange?.(imagen);
			}
		} catch (cause) {
			error = cause instanceof Error ? cause.message : 'No se pudo cargar la foto.';
		} finally {
			input.value = '';
		}
	}
</script>

<div class="photo-picker">
	{#if multiple}
		<div class="photo-picker__gallery">
			{#each values as imagen, index}
				<img src={imagen} alt={`Vista previa ${index + 1}`} />
			{/each}
		</div>
	{:else if value}
		<img src={value} alt="Vista previa" />
	{/if}
	<label class="photo-picker__button">
		<span aria-hidden="true">📷</span>
		{multiple ? `Agregar foto (${values.length}/3)` : value ? 'Cambiar foto' : 'Agregar foto (opcional)'}
		<input type="file" accept="image/*" onchange={elegir} disabled={multiple && values.length >= 3} />
	</label>
	{#if multiple}
		{#each values as _, index}
			<button
				class="photo-picker__remove"
				type="button"
				onclick={() => onvalueschange?.(values.filter((_, itemIndex) => itemIndex !== index))}
				>Quitar foto {index + 1}</button
			>
		{/each}
	{:else if value}<button class="photo-picker__remove" type="button" onclick={() => onchange?.(null)}
			>Quitar</button
		>{/if}
	{#if error}<small role="alert">{error}</small>{/if}
</div>
