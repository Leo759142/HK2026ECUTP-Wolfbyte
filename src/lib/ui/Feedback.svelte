<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { t } from '../../lib/i18n.svelte';

	export let tipo: 'error' | 'ok' | 'aviso' | 'cargando' = 'error';
	export let clave = '';
	export let texto = '';
	export let reintentar: (() => void) | undefined;

	const dispatch = createEventDispatcher();

	const mensaje = texto || (clave ? t(clave) : '');
	let clase = 'notice';
	if (tipo === 'error') clase += ' notice--error';
	else if (tipo === 'ok') clase += ' notice--ok';
	else if (tipo === 'aviso') clase += ' notice--ok';
	else clase += ' muted';

	let rol = 'status';
	if (tipo === 'error') rol = 'alert';
</script>

{#if mensaje || reintentar}
	<p class={clase} role={rol} aria-live="polite">
		{mensaje}
		{#if reintentar}
			<button type="button" onclick={() => dispatch('cerrar')} aria-label="Reintentar">Reintentar</button>
		{/if}
	</p>
{/if}
