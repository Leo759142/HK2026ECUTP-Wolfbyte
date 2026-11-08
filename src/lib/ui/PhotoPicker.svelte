<script lang="ts">
	interface Props {
		value?: string | null;
		onchange: (value: string | null) => void;
	}

	let { value = null, onchange }: Props = $props();
	let error = $state('');

	function comprimir(file: File): Promise<string> {
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

	async function elegir(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		error = '';
		try {
			onchange(await comprimir(file));
		} catch (cause) {
			error = cause instanceof Error ? cause.message : 'No se pudo cargar la foto.';
		} finally {
			input.value = '';
		}
	}
</script>

<div class="photo-picker">
	{#if value}<img src={value} alt="Vista previa" />{/if}
	<label class="photo-picker__button">
		<span aria-hidden="true">📷</span>
		{value ? 'Cambiar foto' : 'Agregar foto (opcional)'}
		<input type="file" accept="image/*" onchange={elegir} />
	</label>
	{#if value}<button class="photo-picker__remove" type="button" onclick={() => onchange(null)}
			>Quitar</button
		>{/if}
	{#if error}<small role="alert">{error}</small>{/if}
</div>
