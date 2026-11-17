<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { mensajeHttp, gestorIdiomas } from '../i18n';

	const status = $derived(page.status);
	const estadosConocidos = [400, 401, 403, 404, 408, 429, 500, 503];
	const mensaje = $derived.by(() => {
		if (estadosConocidos.includes(page.status)) return mensajeHttp(page.status);
		return page.error?.message ?? mensajeHttp(page.status);
	});

	function volver() {
		if (typeof history !== 'undefined' && history.length > 1) history.back();
		else goto('/');
	}
</script>

<svelte:head>
	<title>{gestorIdiomas.tConVars('error.pagina.titulo_documento', { status })}</title>
</svelte:head>

<section class="app-screen error-screen" aria-labelledby="error-title">
	<div class="error-card">
		<p
			class="error-code"
			aria-label={gestorIdiomas.tConVars('error.pagina.codigo', { codigo: status })}
		>
			{String(status).padStart(3, '0')}
		</p>
		<h1 id="error-title">{gestorIdiomas.t('error.pagina.titulo')}</h1>
		<p class="error-message">{mensaje}</p>
		<div class="error-actions">
			<button class="mobile-btn mobile-btn--primary" type="button" onclick={volver}
				>{gestorIdiomas.t('error.pagina.volver')}</button
			>
			<a class="mobile-btn mobile-btn--outline" href="/">{gestorIdiomas.t('error.pagina.inicio')}</a
			>
			<button class="mobile-btn mobile-btn--outline" type="button" onclick={() => location.reload()}
				>{gestorIdiomas.t('error.pagina.reintentar')}</button
			>
		</div>
	</div>
</section>
