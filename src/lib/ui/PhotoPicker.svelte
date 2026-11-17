<script lang="ts">
	import { onDestroy } from 'svelte';
	import { gestorIdiomas, mensajeErrorDominio } from '../../i18n';
	import Icono from '../iconos/Icono.svelte';
	import {
		archivosDesdeClipboard,
		archivosDesdeDataTransfer,
		liberarImagen,
		procesarArchivos,
		type ImagenNormalizada
	} from '../infra/imagen/procesar';

	interface Props {
		value?: string | null;
		onchange?: (value: string | null) => void;
		values?: string[];
		onvalueschange?: (values: string[]) => void;
		multiple?: boolean;
		max?: number;
		maxSizeMB?: number;
	}

	let {
		value = null,
		onchange,
		values = [],
		onvalueschange,
		multiple = false,
		max = 1,
		maxSizeMB = 5
	}: Props = $props();

	let inputEl: HTMLInputElement | null = $state(null);
	let error = $state('');
	let aviso = $state('');
	let procesando = $state(false);
	let arrastrando = $state(false);
	let dragDepth = 0;
	let interno: ImagenNormalizada[] = $state([]);

	// La API (validarFoto) sólo acepta fotos de hasta 400 KB en base64. Comprimimos la
	// salida a ~280 KB binarios (~373 KB en base64) para que entre con margen al publicar.
	const MAX_BYTES_SALIDA = 280 * 1024;

	const esMultiple = $derived(multiple && max > 1);
	const limite = $derived(esMultiple ? max : 1);
	const actuales = $derived(esMultiple ? values : value ? [value] : []);
	const lleno = $derived(actuales.length >= limite);
	const ayudaId = `foto-ayuda-${Math.random().toString(36).slice(2, 8)}`;
	const estadoId = `foto-estado-${Math.random().toString(36).slice(2, 8)}`;
	const errorId = `foto-error-${Math.random().toString(36).slice(2, 8)}`;
	const etiquetaZona = $derived(
		`Agregar foto. Arrastra, pega o selecciona (máx. ${limite}, ${maxSizeMB} MB)`
	);

	function sincronizarInterno(desde: string[]) {
		const previo = interno;
		if (desde.length === 0) {
			for (const img of previo) liberarImagen(img);
			interno = [];
			return;
		}
		const usado = new Set<number>();
		interno = desde.map((dataUrl) => {
			const idx = previo.findIndex((img, i) => !usado.has(i) && img.dataUrl === dataUrl);
			if (idx >= 0) {
				usado.add(idx);
				return previo[idx];
			}
			return {
				meta: {
					id:
						crypto.randomUUID?.() ?? `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
					name: 'imagen',
					sizeOriginal: 0,
					typeOriginal: 'image/*',
					lastModified: Date.now(),
					origen: 'seleccion' as const
				},
				dataUrl
			};
		});
		for (let i = 0; i < previo.length; i++) if (!usado.has(i)) liberarImagen(previo[i]);
	}

	$effect(() => {
		const desde = esMultiple ? [...values] : value ? [value] : [];
		const actual = interno.map((i) => i.dataUrl);
		const mismo = actual.length === desde.length && actual.every((v, i) => v === desde[i]);
		if (!mismo) sincronizarInterno(desde);
	});

	onDestroy(() => {
		for (const img of interno) liberarImagen(img);
	});

	function emitir(lista: ImagenNormalizada[]) {
		const dataUrls = lista.map((i) => i.dataUrl);
		if (esMultiple) onvalueschange?.(dataUrls);
		else onchange?.(dataUrls[0] ?? null);
	}

	function limpiarAvisos() {
		error = '';
		aviso = '';
	}

	async function ingestar(
		files: File[] | FileList | null | undefined,
		origen: 'seleccion' | 'drop' | 'paste'
	) {
		if (!files || (Array.isArray(files) ? files.length === 0 : files.length === 0)) return;
		if (lleno) {
			error =
				limite === 1
					? gestorIdiomas.t('error.foto.limite_uno')
					: gestorIdiomas.tConVars('error.foto.limite', { max: limite });
			return;
		}
		limpiarAvisos();
		procesando = true;
		try {
			const { aceptadas, rechazos } = await procesarArchivos(files, {
				reglas: {
					maxArchivos: limite,
					maxBytesEntrada: maxSizeMB * 1024 * 1024,
					maxBytesSalida: Math.min(maxSizeMB * 1024 * 1024, MAX_BYTES_SALIDA)
				},
				actuales: actuales.length,
				origen
			});
			if (rechazos.length) error = rechazos[0].mensaje;
			if (aceptadas.length) {
				const siguiente = esMultiple ? [...interno, ...aceptadas] : [aceptadas[0]];
				if (!esMultiple) for (const img of interno) liberarImagen(img);
				interno = siguiente.slice(0, limite);
				emitir(interno);
				aviso = aceptadas.length === 1 ? 'Imagen lista.' : `${aceptadas.length} imágenes listas.`;
			}
		} catch (cause) {
			error =
				cause instanceof Error
					? mensajeErrorDominio(cause)
					: gestorIdiomas.t('error.foto.carga_fallo');
		} finally {
			procesando = false;
		}
	}

	function abrirSelector() {
		if (procesando || lleno) return;
		inputEl?.click();
	}

	async function alCambiarInput(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		await ingestar(input.files, 'seleccion');
		input.value = '';
	}

	function quitar(index: number) {
		const img = interno[index];
		if (img) liberarImagen(img);
		const siguiente = interno.filter((_, i) => i !== index);
		interno = siguiente;
		emitir(siguiente);
		limpiarAvisos();
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			abrirSelector();
		}
	}

	function onDragEnter(event: DragEvent) {
		event.preventDefault();
		if (procesando || lleno) return;
		dragDepth += 1;
		arrastrando = true;
	}

	function onDragOver(event: DragEvent) {
		event.preventDefault();
		if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
		if (!procesando && !lleno) arrastrando = true;
	}

	function onDragLeave(event: DragEvent) {
		event.preventDefault();
		dragDepth = Math.max(0, dragDepth - 1);
		if (dragDepth === 0) arrastrando = false;
	}

	async function onDrop(event: DragEvent) {
		event.preventDefault();
		dragDepth = 0;
		arrastrando = false;
		if (procesando || lleno) return;
		await ingestar(archivosDesdeDataTransfer(event.dataTransfer), 'drop');
	}

	async function onPaste(event: ClipboardEvent) {
		if (procesando || lleno) return;
		const files = archivosDesdeClipboard(event.clipboardData);
		if (!files.length) return;
		event.preventDefault();
		await ingestar(files, 'paste');
	}

	async function pegarDesdePortapapeles() {
		if (procesando || lleno) return;
		limpiarAvisos();
		try {
			if (!navigator.clipboard || !('read' in navigator.clipboard)) {
				aviso = 'Usa Ctrl+V o Cmd+V para pegar una imagen.';
				return;
			}
			const items = await navigator.clipboard.read();
			const files: File[] = [];
			for (const item of items) {
				const type = item.types.find((t) => t.startsWith('image/'));
				if (!type) continue;
				const blob = await item.getType(type);
				files.push(new File([blob], `pegado-${Date.now()}`, { type: blob.type || type }));
			}
			if (!files.length) {
				aviso = 'No hay una imagen en el portapapeles.';
				return;
			}
			await ingestar(files, 'paste');
		} catch {
			aviso = 'No se pudo leer el portapapeles. Usa Ctrl+V o Cmd+V para pegar.';
		}
	}

	function nombreCorto(nombre: string) {
		return nombre.length > 22 ? `${nombre.slice(0, 19)}…` : nombre;
	}

	function tamano(meta: { sizeNormalizado?: number; sizeOriginal: number }) {
		const bytes = meta.sizeNormalizado || meta.sizeOriginal;
		if (!bytes) return '';
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${Math.round(bytes / 102.4) / 10} KB`;
		return `${Math.round(bytes / 104857.6) / 10} MB`;
	}
</script>

<div class="photo-picker photo-picker--enhanced">
	<div
		class="photo-picker__dropzone"
		class:photo-picker__dropzone--drag={arrastrando}
		class:photo-picker__dropzone--disabled={procesando || lleno}
		role="button"
		tabindex={procesando || lleno ? -1 : 0}
		aria-label={etiquetaZona}
		aria-describedby={ayudaId}
		aria-disabled={procesando || lleno}
		onclick={abrirSelector}
		onkeydown={onKeydown}
		ondragenter={onDragEnter}
		ondragover={onDragOver}
		ondragleave={onDragLeave}
		ondrop={onDrop}
		onpaste={onPaste}
	>
		<input
			bind:this={inputEl}
			class="photo-picker__input"
			type="file"
			accept="image/*, application/pdf, .jpg, .jpeg, .png, .webp"
			onchange={alCambiarInput}
			disabled={procesando || lleno}
			tabindex="-1"
			aria-hidden="true"
		/>
		<span class="photo-picker__icon" aria-hidden="true"><Icono name="camara" /></span>
		<span class="photo-picker__copy">
			<strong
				>{arrastrando
					? 'Suelta para agregar'
					: lleno
						? 'Imagen agregada'
						: actuales.length
							? 'Cambiar o agregar imagen'
							: 'Agregar foto'}</strong
			>
			<small id={ayudaId}>Arrastra, pega o selecciona (máx. {limite}, {maxSizeMB} MB)</small>
		</span>
		<span class="photo-picker__badge">{actuales.length}/{limite}</span>
	</div>

	<div class="photo-picker__actions-row">
		<button
			class="photo-picker__action"
			type="button"
			onclick={abrirSelector}
			disabled={procesando || lleno}
		>
			{actuales.length ? 'Cambiar foto' : 'Seleccionar foto'}
		</button>
		<button
			class="photo-picker__action photo-picker__action--ghost"
			type="button"
			onclick={pegarDesdePortapapeles}
			disabled={procesando || lleno}
		>
			Pegar imagen
		</button>
	</div>

	{#if interno.length}
		<ul class="photo-picker__previews" aria-label="Fotos seleccionadas">
			{#each interno as imagen, index (imagen.meta.id)}
				<li class="photo-picker__preview">
					<img
						src={imagen.previewUrl || imagen.dataUrl}
						alt={limite === 1
							? 'Vista previa de la foto seleccionada (1 de 1)'
							: `Vista previa de la foto ${index + 1} de ${interno.length}`}
					/>
					<div class="photo-picker__meta">
						<span class="photo-picker__name">{nombreCorto(imagen.meta.name)}</span>
						{#if tamano(imagen.meta)}<span class="photo-picker__size">{tamano(imagen.meta)}</span
							>{/if}
					</div>
					<button
						class="photo-picker__remove"
						type="button"
						onclick={() => quitar(index)}
						aria-label={limite === 1 ? 'Quitar foto' : `Quitar foto ${index + 1}`}
					>
						Quitar
					</button>
				</li>
			{/each}
		</ul>
	{/if}

	<div class="photo-picker__status" aria-live="polite" id={estadoId}>
		{#if procesando}<span>Optimizando imagen…</span>{/if}
		{#if aviso && !procesando && !error}<span>{aviso}</span>{/if}
	</div>
	{#if error}
		<p class="photo-picker__error" role="alert" id={errorId}>{error}</p>
	{/if}
</div>
