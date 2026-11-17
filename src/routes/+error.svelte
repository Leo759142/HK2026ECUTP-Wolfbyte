<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	const status = $derived(page.status);
	const mensaje = $derived.by(() => {
		switch (page.status) {
			case 400:
				return 'La solicitud no es válida. Revisa los datos e inténtalo de nuevo.';
			case 401:
				return 'Necesitas iniciar sesión para continuar.';
			case 403:
				return 'No tienes permiso para ver esta página.';
			case 404:
				return 'La página que buscas no existe o fue movida.';
			case 408:
				return 'La solicitud tardó demasiado. Intenta nuevamente.';
			case 429:
				return 'Hay muchas solicitudes. Espera un momento e inténtalo otra vez.';
			case 500:
				return 'Ocurrió un problema en el servidor.';
			case 503:
				return 'El servicio no está disponible por ahora.';
			default:
				return page.error?.message ?? 'Ocurrió un error inesperado.';
		}
	});

	function volver() {
		if (typeof history !== 'undefined' && history.length > 1) history.back();
		else goto('/');
	}
</script>

<svelte:head>
	<title>Error {status} | AYNI</title>
</svelte:head>

<section class="app-screen error-screen" aria-labelledby="error-title">
	<div class="error-card">
		<p class="error-code" aria-label={`Código de error ${status}`}>{String(status).padStart(3, '0')}</p>
		<h1 id="error-title">No pudimos mostrar esta página</h1>
		<p class="error-message">{mensaje}</p>
		<div class="error-actions">
			<button class="mobile-btn mobile-btn--primary" type="button" onclick={volver}>Volver</button>
			<a class="mobile-btn mobile-btn--outline" href="/">Ir al inicio</a>
			<button class="mobile-btn mobile-btn--outline" type="button" onclick={() => location.reload()}
				>Reintentar</button
			>
		</div>
	</div>
</section>
