<script lang="ts">
	import { page } from '$app/state';
	import { encolarAccion } from '../../sync/outbox.svelte';
	import type { CategoriaServicio } from '../../dominio/tipos/tipos';
	import { construirPublicacion, tipoDesdeUrl, type TipoPublicacion } from '#lib/publicar';
	import { PublicarServicio, obtenerUsuarioCliente } from '../../aplicacion/servicios';
	import { ServicioRepoLocal } from '../../repositorios/servicio.local';
	import Btn from '../../lib/ui/Btn.svelte';
	import Header from '../../lib/ui/Header.svelte';
	import PhotoPicker from '../../lib/ui/PhotoPicker.svelte';
	import Screen from '../../lib/ui/Screen.svelte';

	const publicarServicio = new PublicarServicio(new ServicioRepoLocal());
	const categorias = [
		['gasfiteria', '🔧', 'Gasfitería'],
		['electricidad', '⚡', 'Electricidad'],
		['carpinteria', '🪚', 'Carpintería'],
		['cerrajeria', '🔑', 'Cerrajería'],
		['comida', '🍲', 'Comida'],
		['cuidado', '🤲', 'Cuidado'],
		['otro', '✨', 'Otro']
	];
	const categoriasFavor = [
		['prestamo_herramienta', '🧰', 'Herramienta'],
		['ayuda_temporal', '⏱️', 'Ayuda temporal'],
		['donacion', '🎁', 'Donación'],
		['trueque_habilidad', '🔁', 'Trueque'],
		['movilidad', '🚗', 'Movilidad'],
		['otro', '✨', 'Otro']
	];
	const tiposAlerta = [
		['persona_vulnerable', '🧑‍🦽', 'Persona vulnerable'],
		['zona_inundada', '🌧️', 'Zona inundada'],
		['sin_servicios_basicos', '🚰', 'Sin servicios'],
		['riesgo_estructural', '🏚️', 'Riesgo estructural'],
		['otro', '⚠️', 'Otro']
	];
	let paso = $state(1);
	let tipo = $state<TipoPublicacion>(tipoDesdeUrl(page.url.searchParams.get('tipo')));
	let mensaje = $state('');
	let error = $state('');
	let guardando = $state(false);
	let form = $state({
		zona_id: 'zona-demo',
		titulo: '',
		descripcion: '',
		categoria: 'otro',
		tipo_favor: 'necesidad',
		categoria_favor: 'otro',
		tipo_alerta: 'otro',
		lat_aprox: -12.046,
		lng_aprox: -77.043,
		foto: null as string | null
	});

	async function enviar() {
		error = '';
		mensaje = '';
		const pub = construirPublicacion(tipo, form);
		if (!pub.ok) {
			error = pub.error;
			return;
		}
		guardando = true;
		try {
			if (tipo === 'servicio') {
				const creado = await publicarServicio.ejecutar({
					usuario_id: obtenerUsuarioCliente(),
					zona_id: form.zona_id,
					categoria: form.categoria as CategoriaServicio,
					titulo: form.titulo.trim(),
					descripcion: form.descripcion.trim(),
					foto: form.foto,
					lat_aprox: form.lat_aprox,
					lng_aprox: form.lng_aprox
				});
				mensaje = `Servicio “${creado.titulo}” guardado. Se enviará cuando haya señal.`;
			} else {
				await encolarAccion(pub.entidad, pub.body);
				mensaje =
					typeof navigator === 'undefined' || navigator.onLine !== false
						? 'Publicación guardada. Enviando…'
						: 'Guardada en tu celular. Se enviará cuando vuelva la señal.';
			}
			paso = 3;
		} catch {
			error = 'No se pudo guardar. Intenta de nuevo.';
		} finally {
			guardando = false;
		}
	}

	function otra() {
		paso = 1;
		form.titulo = '';
		form.descripcion = '';
		form.foto = null;
		mensaje = '';
		error = '';
	}
</script>

<svelte:head><title>Publicar | AYNI</title></svelte:head>

<Screen class="publish-screen">
	<Header title="Publicar en 3 pasos" />
	<div class="publish-progress" aria-label={`Paso ${paso} de 3`}>
		{#each [1, 2, 3] as numero}<span class:active={numero <= paso}></span>{/each}
	</div>
	{#if error}<p class="notice notice--error" role="alert">{error}</p>{/if}
	{#if paso === 1}
		<h1 class="mobile-title">¿Qué quieres compartir?</h1>
		<p class="mobile-subtitle">Elige una opción para ayudar a tu comunidad.</p>
		<div class="publish-type-grid">
			<button class:active={tipo === 'servicio'} type="button" onclick={() => (tipo = 'servicio')}
				><span>🛠️</span><strong>Servicio</strong><small>Ofrece lo que sabes hacer</small></button
			>
			<button class:active={tipo === 'favor'} type="button" onclick={() => (tipo = 'favor')}
				><span>🤝</span><strong>Favor</strong><small>Pide o brinda ayuda</small></button
			>
			<button class:active={tipo === 'alerta'} type="button" onclick={() => (tipo = 'alerta')}
				><span>⚠️</span><strong>Alerta</strong><small>Informa una necesidad</small></button
			>
		</div>
		<div class="access-spacer"></div>
		<Btn variant="acento" onclick={() => (paso = 2)}>Continuar</Btn>
	{:else if paso === 2}
		<h1 class="mobile-title">
			{tipo === 'servicio'
				? 'Cuéntanos sobre tu servicio'
				: tipo === 'favor'
					? 'Cuéntanos sobre el favor'
					: 'Describe la alerta'}
		</h1>
		<p class="mobile-subtitle">La ubicación será aproximada para proteger tu privacidad.</p>
		<label class="publish-label"
			>Título<input
				class="publish-input"
				bind:value={form.titulo}
				maxlength="80"
				placeholder={tipo === 'alerta' ? '¿Qué está pasando?' : 'Ej. Gasfitería y reparaciones'}
			/></label
		>
		<label class="publish-label"
			>Descripción<textarea
				class="publish-input publish-textarea"
				bind:value={form.descripcion}
				maxlength={tipo === 'alerta' ? 300 : 500}
				placeholder="Agrega los detalles importantes"></textarea></label
		>
		{#if tipo === 'servicio'}
			<div class="publish-label">
				Categoría
				<div class="publish-options">
					{#each categorias as [id, emoji, label]}<button
							class:active={form.categoria === id}
							type="button"
							onclick={() => (form.categoria = id)}><span>{emoji}</span>{label}</button
						>{/each}
				</div>
			</div>
		{:else if tipo === 'favor'}
			<div class="publish-label">
				¿Qué tipo de favor?
				<div class="publish-segment">
					<button
						class:active={form.tipo_favor === 'necesidad'}
						type="button"
						onclick={() => (form.tipo_favor = 'necesidad')}>Necesito ayuda</button
					><button
						class:active={form.tipo_favor === 'oferta'}
						type="button"
						onclick={() => (form.tipo_favor = 'oferta')}>Ofrezco ayuda</button
					>
				</div>
			</div>
			<div class="publish-label">
				Categoría
				<div class="publish-options">
					{#each categoriasFavor as [id, emoji, label]}<button
							class:active={form.categoria_favor === id}
							type="button"
							onclick={() => (form.categoria_favor = id)}><span>{emoji}</span>{label}</button
						>{/each}
				</div>
			</div>
		{:else}
			<div class="publish-label">
				Tipo de alerta
				<div class="publish-options">
					{#each tiposAlerta as [id, emoji, label]}<button
							class:active={form.tipo_alerta === id}
							type="button"
							onclick={() => (form.tipo_alerta = id)}><span>{emoji}</span>{label}</button
						>{/each}
				</div>
			</div>
		{/if}
		<div class="publish-label">
			Foto opcional<PhotoPicker value={form.foto} onchange={(value) => (form.foto = value)} />
		</div>
		<div class="publish-actions">
			<button class="mobile-btn mobile-btn--outline" type="button" onclick={() => (paso = 1)}
				>Atrás</button
			><Btn variant={tipo === 'alerta' ? 'rojo' : 'acento'} disabled={guardando} onclick={enviar}
				>{guardando ? 'Guardando…' : 'Publicar'}</Btn
			>
		</div>
	{:else}
		<div class="publish-success">
			<span>✅</span>
			<h1>¡Publicado!</h1>
			<p>{mensaje}</p>
		</div>
		<div class="access-spacer"></div>
		<a class="mobile-btn mobile-btn--primary" href="/">Ir al inicio</a>
		<button class="mobile-btn mobile-btn--outline" type="button" onclick={otra}
			>Publicar otra</button
		>
	{/if}
</Screen>
