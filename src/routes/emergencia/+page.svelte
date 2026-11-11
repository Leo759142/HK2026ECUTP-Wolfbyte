<script lang="ts">
	import { onMount } from 'svelte';
	import { encolarAccion } from '../../sync/outbox.svelte';
	import { construirPublicacion } from '../../lib/publicar';
	import PhotoPicker from '../../lib/ui/PhotoPicker.svelte';
	import { t } from '../../lib/i18n.svelte';
	import { idioma } from '../../lib/i18n.svelte';
	import { FormateadorComunitario } from '../../i18n/formatos';

	type Alerta = {
		id: string;
		tipo?: string;
		descripcion?: string;
		estado?: string;
		creado_en?: string;
		createdAt?: string;
		foto?: string | null;
	};

	const tipos = [
		['persona_vulnerable', '🧑‍🦽', 'Persona vulnerable'],
		['zona_inundada', '🌧️', 'Zona inundada'],
		['via_bloqueada', '🚧', 'Vía bloqueada'],
		['sin_servicios_basicos', '🚰', 'Sin servicios básicos'],
		['riesgo_estructural', '🏚️', 'Riesgo estructural'],
		['otro', '⚠️', 'Otra situación']
	] as const;

	let items = $state<Alerta[]>([]);
	let error = $state('');
	let cargando = $state(true);
	let guardando = $state(false);
	let mostrandoNumeros = $state(false);
	let reporteEnviado = $state(false);
	let reporteId = $state('');
	let tipo = $state('zona_inundada');
	let detalles = $state('');
	let foto = $state<string | null>(null);

	// Resolver etiqueta de tipo usando i18n
	const etiquetaTipo = (valor?: string) =>
		tipos.find(([id]) => id === valor)?.[2] ?? valor ?? t('alerta.situacion_indefinida');

	// Texto de estado usando i18n
	const estadoTexto = (estado?: string) => {
		if (estado === 'confirmado_vecinos' || estado === 'confirmado') return t('alerta.confirmada');
		if (estado === 'atendido') return t('alerta.atendida');
		if (estado === 'descartado') return t('alerta.descartada');
		return t('alerta.pendiente_verificacion');
	};

	const fechaTexto = (valor?: string) => {
		if (!valor) return t('alerta.fecha_reciente');
		const fecha = new Date(valor);
		return Number.isNaN(fecha.getTime())
			? t('alerta.fecha_reciente')
			: FormateadorComunitario.fechaCorta(fecha, get(idioma));
	};

	const cargar = async () => {
		cargando = true;
		error = '';
		try {
			const response = await fetch('/api/v1/alertas');
			if (!response.ok) throw new Error('No se pudieron cargar las alertas.');
			items = (await response.json()).items ?? [];
		} catch (cause) {
			error = cause instanceof Error ? cause.message : 'No se pudieron cargar las alertas.';
		} finally {
			cargando = false;
		}
	};

	async function enviarReporte() {
		error = '';
		const pub = construirPublicacion('alerta', {
			zona_id: 'zona-demo',
			titulo: etiquetaTipo(tipo),
			descripcion: detalles,
			categoria: '',
			tipo_favor: '',
			categoria_favor: '',
			tipo_alerta: tipo,
			lat_aprox: -12.046,
			lng_aprox: -77.043,
			foto
		});
		if (!pub.ok) {
			error = pub.error;
			return;
		}
		guardando = true;
		try {
			reporteId = await encolarAccion(pub.entidad, pub.body);
			reporteEnviado = true;
			detalles = '';
			foto = null;
		} catch {
			error = 'No se pudo guardar el reporte. Intenta de nuevo.';
		} finally {
			guardando = false;
		}
	}

	function nuevoReporte() {
		reporteEnviado = false;
		reporteId = '';
		error = '';
		tipo = 'zona_inundada';
		detalles = '';
		foto = null;
	}

	onMount(cargar);
</script>

<svelte:head><title>Emergencia | AYNI</title></svelte:head>

<section class="emergency-page">
	<div class="emergency-hero">
		<div class="emergency-hero__icon">🚨</div>
		<div>
			<h1>Emergencias y ayuda</h1>
			<p>Reporta una situación y mantén informado a tu sector.</p>
		</div>
	</div>
	<div class="emergency-actions">
		<a class="emergency-action emergency-action--primary" href="/pedir-ayuda">
			<strong>🆘 Necesito ayuda</strong>
			<span>Guarda un pedido local y revisa opciones de apoyo</span>
		</a>
		<a class="emergency-action" href="/grupos">
			<strong>👥 Ver grupos y servicios de apoyo</strong>
			<span>Consulta redes comunitarias disponibles</span>
		</a>
	</div>

	{#if reporteEnviado}
		<div class="emergency-submitted" role="status" aria-live="polite">
			<div class="emergency-submitted__icon">✅</div>
			<h2>Reporte enviado</h2>
			<p>Un Guardián de tu sector revisará la situación. Te avisaremos cuando haya novedades.</p>
			<small>Guardado en tu celular · Código {reporteId.slice(0, 8)}</small>
			<div class="emergency-submitted__actions">
				<a class="emergency-action emergency-action--primary" href="/mapa">
					<strong>Ver apoyo cercano</strong>
					<span>Consulta servicios, favores y alertas</span>
				</a>
				<button
					class="emergency-action emergency-action--button"
					type="button"
					onclick={nuevoReporte}
				>
					<strong>Reportar otra situación</strong>
					<span>Crear un nuevo reporte</span>
				</button>
			</div>
		</div>
	{:else}
		<form
			class="emergency-report"
			onsubmit={(event) => {
				event.preventDefault();
				void enviarReporte();
			}}
		>
			<div class="section-heading">
				<div>
					<h2>¿Qué está pasando?</h2>
					<p>Lo verá un Guardián de tu sector.</p>
				</div>
			</div>
			<div class="emergency-type-grid" aria-label="Tipo de emergencia">
				{#each tipos as [id, emoji, label]}
					<button class:active={tipo === id} type="button" onclick={() => (tipo = id)}>
						<span>{emoji}</span><strong>{label}</strong>
					</button>
				{/each}
			</div>
			<label class="publish-label">
				Detalles (opcional)
				<textarea
					class="publish-input publish-textarea"
					bind:value={detalles}
					maxlength="300"
					placeholder="Cuéntanos qué ocurre y a quiénes afecta"></textarea>
			</label>
			<div class="publish-label">
				Foto opcional
				<PhotoPicker value={foto} onchange={(value) => (foto = value)} />
			</div>
			<p class="emergency-location">📍 Ubicación aproximada · Mz. de tu sector</p>
			{#if error}<p class="notice notice--error" role="alert">{error}</p>{/if}
			<button class="mobile-btn mobile-btn--danger" type="submit" disabled={guardando}>
				{guardando ? 'Guardando reporte…' : 'Enviar reporte'}
			</button>
		</form>
	{/if}

	<div class="emergency-callout">
		<strong>Si hay peligro inmediato</strong>
		<p>Llama a emergencias de tu localidad. AYNI no reemplaza a los servicios oficiales.</p>
		<button
			type="button"
			class="profile-link profile-link--button"
			onclick={() => (mostrandoNumeros = !mostrandoNumeros)}
		>
			{mostrandoNumeros ? 'Ocultar números' : 'Ver números de ayuda'}
		</button>
		{#if mostrandoNumeros}
			<div class="emergency-numbers">
				<a href="tel:911">911 <span>Emergencias</span></a>
				<a href="tel:105">105 <span>Policía</span></a>
				<a href="tel:116">116 <span>Bomberos</span></a>
			</div>
		{/if}
	</div>

	<div class="section-heading">
		<div>
			<h2>Alertas de tu comunidad</h2>
			<p>Solo mostramos ubicaciones aproximadas.</p>
		</div>
		<button class="text-button" type="button" onclick={cargar} disabled={cargando}
			>Actualizar</button
		>
	</div>

	{#if error && !reporteEnviado}
		<div class="feedback feedback--error" role="alert">
			{error} <button type="button" onclick={cargar}>Reintentar</button>
		</div>
	{:else if cargando}
		<p class="empty" role="status">Cargando alertas…</p>
	{:else if items.length === 0}
		<div class="empty">No hay alertas activas en este momento.</div>
	{:else}
		<div class="emergency-list">
			{#each items as alerta (alerta.id)}
				<article class="emergency-card">
					<div class="emergency-card__icon">🚨</div>
					<div>
						<div class="emergency-card__heading">
							<strong>{etiquetaTipo(alerta.tipo)}</strong>
							<span>{estadoTexto(alerta.estado)}</span>
						</div>
						{#if alerta.descripcion}<p>{alerta.descripcion}</p>{/if}
						<small>Ubicación aproximada · {fechaTexto(alerta.creado_en ?? alerta.createdAt)}</small>
					</div>
				</article>
			{/each}
		</div>
	{/if}
</section>
