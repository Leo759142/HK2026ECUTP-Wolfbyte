<script lang="ts">
	import { onMount } from 'svelte';

	type Grupo = {
		id?: string;
		nombre?: string;
		tipo?: string;
		reglas?: string;
		modo_emergencia?: boolean;
		contacto?: string;
	};

	const demoGrupos: Grupo[] = [
		{
			id: 'apoyo-vecinal',
			nombre: 'Red de apoyo vecinal',
			tipo: 'Comunidad',
			reglas: 'Coordinación entre vecinos para acompañar y compartir información útil.',
			modo_emergencia: true
		},
		{
			id: 'cuidado-mayores',
			nombre: 'Cuidado de personas mayores',
			tipo: 'Cuidados',
			reglas: 'Organiza turnos y apoyo para vecinos que lo necesiten.'
		}
	];

	let grupos = $state<Grupo[]>([]);
	let origen = $state<'local' | 'demo'>('local');
	let cargando = $state(true);

	function leerGrupos(): Grupo[] {
		try {
			const raw = localStorage.getItem('ayni:v1:grupos');
			return raw ? (JSON.parse(raw) as Grupo[]) : [];
		} catch {
			return [];
		}
	}

	onMount(() => {
		const locales = leerGrupos();
		grupos = locales.length ? locales : demoGrupos;
		origen = locales.length ? 'local' : 'demo';
		cargando = false;
	});
</script>

<svelte:head><title>Grupos y apoyo | AYNI</title></svelte:head>

<section class="app-screen emergency-groups-page">
	<header class="mobile-header">
		<a class="mobile-header__back" href="/emergencia" aria-label="Volver a emergencias">←</a>
		<strong>Grupos y apoyo</strong>
	</header>

	<div class="emergency-hero">
		<div class="emergency-hero__icon">👥</div>
		<div>
			<h1>Grupos y servicios de apoyo</h1>
			<p>Encuentra redes comunitarias para coordinar ayuda.</p>
		</div>
	</div>

	{#if origen === 'demo'}
		<p class="notice notice--info">
			Estos grupos son una muestra local. Cuando tu comunidad publique grupos, aparecerán aquí.
		</p>
	{/if}

	{#if cargando}
		<p class="empty" role="status">Cargando grupos…</p>
	{:else}
		<div class="emergency-list">
			{#each grupos as grupo (grupo.id ?? grupo.nombre)}
				<article class="emergency-card emergency-card--group">
					<div class="emergency-card__icon">🤝</div>
					<div>
						<div class="emergency-card__heading">
							<strong>{grupo.nombre ?? 'Grupo comunitario'}</strong>
							{#if grupo.modo_emergencia}<span>Disponible en emergencia</span>{/if}
						</div>
						<small>{grupo.tipo ?? 'Red vecinal'}</small>
						{#if grupo.reglas}<p>{grupo.reglas}</p>{/if}
						{#if grupo.contacto}
							<a class="profile-link" href={`tel:${grupo.contacto}`}>📞 Contactar</a>
						{:else}
							<p class="muted">Contacto disponible cuando el grupo lo configure.</p>
						{/if}
					</div>
				</article>
			{/each}
		</div>
	{/if}

	<a class="mobile-btn mobile-btn--danger" href="/pedir-ayuda">🆘 Necesito ayuda</a>
</section>
