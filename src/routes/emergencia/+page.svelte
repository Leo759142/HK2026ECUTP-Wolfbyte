<script lang="ts">
	import { onMount } from 'svelte';
	import { encolarAccion } from '../../sync/outbox.svelte';
	import { construirPublicacion } from '../../lib/publicar';
	import PhotoPicker from '../../lib/ui/PhotoPicker.svelte';
	import Icono from '../../lib/iconos/Icono.svelte';
	import { esGuardian, obtenerSesionLocal } from '../../lib/onboarding';
	import { telefonosPorDepartamento } from '../../lib/telefonos-peru';
	import { modoEmergencia } from '../../lib/emergencia/estado.svelte';
	import OsmMap from '../../lib/components/OsmMap.svelte';
	import Screen from '../../lib/ui/Screen.svelte';
	import Btn from '../../lib/ui/Btn.svelte';
	import { gestorIdiomas, mensajeErrorDominio } from '../../i18n';

	const t = (key: string) => gestorIdiomas.t(key);

	type TelefonoEmergencia = {
		numero: string;
		nombre: string;
	};

	type Alerta = {
		id: string;
		tipo?: string;
		descripcion?: string;
		estado?: string;
		creado_en?: string;
		createdAt?: string;
		foto?: string | null;
		lat_aprox?: number;
		lng_aprox?: number;
		zona_id?: string;
		manzana?: string;
	};

	const TIPOS_DESASTRE = [
		{
			id: 'persona_vulnerable',
			icono: 'persona_vulnerable',
			etiqueta: 'Persona vulnerable',
			color: '#7b2cbf',
			descripcion: 'Adulto mayor, menor o persona con discapacidad necesita ayuda'
		},
		{
			id: 'zona_inundada',
			icono: 'zona_inundada',
			etiqueta: 'Zona inundada',
			color: '#0E7490',
			descripcion: 'Acumulación de agua, calles anegadas o desbordamiento'
		},
		{
			id: 'via_bloqueada',
			icono: 'via_bloqueada',
			etiqueta: 'Vía bloqueada',
			color: '#e8b04b',
			descripcion: 'Camino o calle obstruido, sin paso vehicular ni peatonal'
		},
		{
			id: 'sin_servicios_basicos',
			icono: 'sin_servicios_basicos',
			etiqueta: 'Sin servicios básicos',
			color: '#0f4c5c',
			descripcion: 'Falta de agua, luz o gas en el sector'
		},
		{
			id: 'riesgo_estructural',
			icono: 'riesgo_estructural',
			etiqueta: 'Riesgo estructural',
			color: '#a3142a',
			descripcion: 'Edificio o vivienda con riesgo de colapso'
		},
		{
			id: 'posto_salud',
			icono: 'medicina',
			etiqueta: 'Emergencia médica',
			color: '#d7263d',
			descripcion: 'Herido, enfermo o necesidad de atención médica urgente'
		},
		{
			id: 'otro',
			icono: 'alerta',
			etiqueta: 'Otra situación',
			color: '#6b7280',
			descripcion: 'Cualquier otra emergencia no listada'
		}
	] as const;

	let telefonos = $state<TelefonoEmergencia[]>([]);
	let departamentoUsuario = $state('');
	let centroMapa = $state<[number, number]>([-12.0464, -77.0428]);

	$effect(() => {
		if (typeof window === 'undefined') return;
		const sector = localStorage.getItem('ayni:v1:sector') || 'Lima';
		const data = telefonosPorDepartamento(sector);
		if (data.length) {
			telefonos = data[0].telefonos;
			departamentoUsuario = data[0].departamento;
			centroMapa = [data[0].lat, data[0].lng];
		}
	});

	let items = $state<Alerta[]>([]);
	let error = $state('');
	let cargando = $state(true);
	let guardando = $state(false);
	let mostrandoNumeros = $state(false);
	let reporteEnviado = $state(false);
	let reporteId = $state('');
	let tipoSeleccionado = $state<string | null>('zona_inundada');
	let detalles = $state('');
	let foto = $state<string | null>(null);
	let fotos = $state<string[]>([]);
	let esGuard = $derived(esGuardian());
	let pendientes = $derived(
		items.filter((a) => a.estado === 'sin_verificar' || a.estado === 'pendiente')
	);
	let lat_aprox = $state<number | null>(null);
	let lng_aprox = $state<number | null>(null);
	let paso = $state<'form' | 'mapa' | 'confirmado'>('form');

	function obtenerUbicacion() {
		if (!navigator.geolocation) return;
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				lat_aprox = Math.round(pos.coords.latitude * 1000) / 1000;
				lng_aprox = Math.round(pos.coords.longitude * 1000) / 1000;
			},
			() => {
				/* silencioso */
			},
			{ enableHighAccuracy: false, timeout: 8000, maximumAge: 30000 }
		);
	}

	const tipoInfo = (id: string) =>
		TIPOS_DESASTRE.find((t) => t.id === id) ?? TIPOS_DESASTRE[TIPOS_DESASTRE.length - 1];

	const etiquetaTipo = (valor?: string) =>
		TIPOS_DESASTRE.find((t) => t.id === valor)?.etiqueta ?? valor ?? 'Situación reportada';

	const estadoTexto = (estado?: string) =>
		estado === 'confirmado_vecinos' || estado === 'confirmado'
			? 'Confirmada por vecinos'
			: estado === 'atendido'
				? 'Atendida'
				: estado === 'descartado'
					? 'Descartada'
					: 'Pendiente de verificación';

	const fechaTexto = (valor?: string) => {
		if (!valor) return 'Reciente';
		const fecha = new Date(valor);
		return Number.isNaN(fecha.getTime())
			? 'Reciente'
			: new Intl.DateTimeFormat('es', { dateStyle: 'short', timeStyle: 'short' }).format(fecha);
	};

	const puntosMapa = $derived<
		{
			id: string;
			titulo?: string;
			tipo?: 'servicio' | 'favor' | 'alerta';
			lat_aprox?: number;
			lng_aprox?: number;
			manzana?: string;
		}[]
	>(
		items.map((a) => ({
			id: a.id,
			titulo: etiquetaTipo(a.tipo),
			tipo: 'alerta' as const,
			lat_aprox: a.lat_aprox,
			lng_aprox: a.lng_aprox,
			manzana: a.manzana ?? a.zona_id
		}))
	);

	function seleccionarTipo(id: string) {
		tipoSeleccionado = id;
		error = '';
	}

	async function enviarReporte() {
		if (guardando || !tipoSeleccionado) return;
		guardando = true;
		error = '';

		// Si no se obtuvo geolocalización, se usa el centro del departamento como aproximación.
		const lat = lat_aprox ?? centroMapa[0];
		const lng = lng_aprox ?? centroMapa[1];
		const zona_id = localStorage.getItem('ayni:v1:sector') ?? departamentoUsuario ?? '';
		const descripcion = detalles.trim();

		const publicacion = construirPublicacion('alerta', {
			zona_id,
			titulo: etiquetaTipo(tipoSeleccionado),
			descripcion,
			categoria: '',
			tipo_favor: '',
			categoria_favor: '',
			tipo_alerta: tipoSeleccionado,
			lat_aprox: lat,
			lng_aprox: lng,
			foto: fotos[0] ?? foto ?? null,
			fotos
		});

		if (!publicacion.ok) {
			error = gestorIdiomas.t(publicacion.error);
			guardando = false;
			return;
		}

		const id = `rep_${Date.now()}`;
		reporteId = id;

		try {
			await encolarAccion(publicacion.entidad, publicacion.body);

			items = [
				{
					id,
					tipo: tipoSeleccionado,
					descripcion,
					estado: 'sin_verificar',
					creado_en: new Date().toISOString(),
					foto: fotos[0] ?? foto ?? null,
					lat_aprox: lat,
					lng_aprox: lng,
					zona_id,
					manzana: zona_id
				},
				...items
			];
			reporteEnviado = true;
			paso = 'confirmado';
		} catch (err) {
			error =
				err instanceof Error
					? mensajeErrorDominio(err)
					: t('error.emergencia.enviar_reporte_fallo');
		} finally {
			guardando = false;
		}
	}

	function confirmar(id: string) {
		const idx = items.findIndex((a) => a.id === id);
		if (idx === -1) return;
		items[idx] = { ...items[idx]!, estado: 'confirmado_vecinos' };
	}

	function descartar(id: string) {
		const idx = items.findIndex((a) => a.id === id);
		if (idx === -1) return;
		items[idx] = { ...items[idx]!, estado: 'descartado' };
	}

	async function cargar() {
		cargando = true;
		error = '';
		try {
			const resp = await fetch('/api/v1/alertas', {
				headers: { 'x-rol': (obtenerSesionLocal()?.rol ?? 'vecino').toLowerCase() }
			});
			if (!resp.ok) throw new Error(t('error.emergencia.carga_fallo'));
			const data = await resp.json();
			items = (data.items ?? []).map((a: any) => ({
				id: a.id,
				tipo: a.tipo,
				descripcion: a.descripcion,
				estado: a.estado,
				creado_en: a.creado_en,
				createdAt: a.createdAt,
				foto: a.foto ?? null,
				lat_aprox: a.lat_aprox,
				lng_aprox: a.lng_aprox,
				zona_id: a.zona_id,
				manzana: a.manzana ?? a.zona_id
			}));
		} catch (err) {
			error = err instanceof Error ? mensajeErrorDominio(err) : t('error.emergencia.carga_fallo');
		} finally {
			cargando = false;
		}
	}

	function nuevoReporte() {
		reporteEnviado = false;
		paso = 'form';
		tipoSeleccionado = 'zona_inundada';
		detalles = '';
		foto = null;
		fotos = [];
		lat_aprox = null;
		lng_aprox = null;
		error = '';
	}

	onMount(() => {
		cargar();
		obtenerUbicacion();
	});
</script>

<Screen>
	<section class="emergency-page">
		{#if reporteEnviado && paso === 'confirmado'}
			<div class="emergency-success">
				<Icono name="check" class="success-icon" />
				<h2>Reporte enviado</h2>
				<p class="codigo">Código: <strong>{reporteId}</strong></p>
				<p class="explicacion">
					Tu reporte está en revisión. Los Guardianes de tu sector serán notificados.
				</p>
				<div class="acciones-confirmado">
					<Btn variant="primary" onclick={nuevoReporte}>Hacer otro reporte</Btn>
					<Btn variant="outline" onclick={cargar}>Ver alertas activas</Btn>
				</div>
			</div>
		{:else if paso === 'mapa'}
			<div class="emergency-mapa-view">
				<h2>Mapa de emergencias</h2>
				<p class="subtitulo">Ubicaciones aproximadas de las alertas en tu sector</p>
				<OsmMap puntos={puntosMapa} esGuardian={esGuard} centro={centroMapa} />
				<div class="leyenda-mapa">
					{#each TIPOS_DESASTRE as tipo}
						<span class="leyenda-item">
							<Icono name={tipo.icono} class="leyenda-icon" />
							<span>{tipo.etiqueta}</span>
						</span>
					{/each}
				</div>
				<Btn variant="primary" onclick={() => (paso = 'form')}>Volver al reporte</Btn>
			</div>
		{:else}
			<form class="emergency-form" onsubmit={enviarReporte}>
				<h1 class="emergency-title">Reportar emergencia</h1>
				<p class="emergency-subtitle">¿Qué está pasando? Selecciona el tipo de situación:</p>

				<div class="tipo-grid">
					{#each TIPOS_DESASTRE as tipo}
						<button
							type="button"
							class:active={tipoSeleccionado === tipo.id}
							class="tipo-btn"
							onclick={() => seleccionarTipo(tipo.id)}
						>
							<Icono name={tipo.icono} class="tipo-icon" />
							<span>{tipo.etiqueta}</span>
						</button>
					{/each}
				</div>

				<label class="publish-label">
					Detalles (opcional)
					<textarea
						class="publish-input"
						bind:value={detalles}
						placeholder={tipoInfo(tipoSeleccionado ?? 'zona_inundada').descripcion}
						rows="3"
						aria-label="Detalles de la emergencia"></textarea>
				</label>

				<PhotoPicker
					multiple
					max={3}
					values={fotos}
					onvalueschange={(vals) => {
						fotos = vals;
						foto = vals[0] ?? null;
					}}
				/>

				<p class="emergency-location">
					<Icono name="ubicacion" /> Ubicación aproximada · Mz. de tu sector
				</p>

				<button
					type="button"
					class="location-btn"
					onclick={obtenerUbicacion}
					disabled={lat_aprox != null}
				>
					<Icono name="ubicacion" />
					{lat_aprox != null ? 'Ubicación detectada' : 'Usar mi ubicación actual'}
				</button>

				{#if error}<p class="notice notice--error" role="alert">{error}</p>{/if}
				<button
					class="mobile-btn mobile-btn--danger"
					type="submit"
					disabled={guardando || !tipoSeleccionado}
				>
					{guardando ? 'Guardando reporte…' : 'Enviar reporte'}
				</button>
			</form>

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
						{#if telefonos.length}
							{#each telefonos as t}
								<a href="tel:{t.numero}" class="emergency-phone-link"
									>{t.numero} <span>{t.nombre}</span></a
								>
							{/each}
						{:else}
							<a href="tel:105">105 <span>Policía</span></a>
							<a href="tel:116">116 <span>Bomberos</span></a>
							<a href="tel:106">106 <span>SAMU</span></a>
						{/if}
					</div>
				{/if}
			</div>

			{#if esGuard && pendientes.length > 0}
				<div class="emergency-callout guardian-section">
					<strong>Alertas pendientes de verificación</strong>
					<p>Confirma o descarta como Guardián.</p>
					{#each pendientes as alerta (alerta.id)}
						<div class="guardian-item guardian-item--danger">
							<strong>{etiquetaTipo(alerta.tipo)}</strong>
							<p>{alerta.descripcion ?? 'Sin descripción'}</p>
							<div class="guardian-actions">
								<button
									class="mobile-btn mobile-btn--primary"
									type="button"
									onclick={() => confirmar(alerta.id)}>Confirmar</button
								>
								<button class="mobile-btn" type="button" onclick={() => descartar(alerta.id)}
									>Descartar</button
								>
							</div>
						</div>
					{/each}
				</div>
			{/if}

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
				<p class="muted" role="status">Cargando alertas…</p>
			{:else if items.length === 0}
				<p class="empty">No hay alertas activas en este momento.</p>
			{:else}
				<OsmMap puntos={puntosMapa} esGuardian={esGuard} centro={centroMapa} />
				<ul class="map-list">
					{#each items as alerta (alerta.id)}
						<li class:selected={false}>
							<button type="button" class="map-list__button" onclick={() => {}}>
								<span class="map-list__icon"><Icono name="alerta" /></span>
								<span>
									<strong>{etiquetaTipo(alerta.tipo)}</strong>
									<small
										>{estadoTexto(alerta.estado)} · {fechaTexto(
											alerta.creado_en ?? alerta.createdAt
										)}</small
									>
								</span>
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		{/if}
	</section>
</Screen>

<style>
	.emergency-page {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.emergency-title {
		font-size: 1.5rem;
		font-weight: 800;
		color: var(--color-tinta, #143d48);
		margin: 0 0 0.5rem;
	}

	.emergency-subtitle {
		color: #6b7280;
		margin: 0 0 1.5rem;
		font-size: 0.95rem;
	}

	.tipo-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 0.75rem;
	}

	.tipo-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 0.75rem;
		border: 2px solid var(--color-linea, #e2e8f0);
		border-radius: 16px;
		background: #fff;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 0.85rem;
		font-weight: 700;
		color: #4b5563;
	}

	.tipo-btn:hover {
		border-color: var(--color-petroleo, #0f4c5c);
		background: #f0f7fa;
	}

	.tipo-btn.active {
		border-color: var(--color-petroleo, #0f4c5c);
		background: #e8f4f8;
		color: var(--color-petroleo, #0f4c5c);
	}

	.tipo-icon {
		font-size: 1.75rem;
		width: 1.75rem;
		height: 1.75rem;
	}

	.publish-label {
		display: block;
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--color-tinta, #143d48);
		margin-bottom: 0.5rem;
	}

	.publish-input {
		width: 100%;
		padding: 0.875rem;
		border: 2px solid var(--color-linea, #e2e8f0);
		border-radius: 12px;
		font-size: 1rem;
		font-family: inherit;
		resize: vertical;
	}

	.publish-input:focus {
		border-color: var(--color-petroleo, #0f4c5c);
		outline: none;
	}

	.emergency-location {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #6b7280;
		font-size: 0.875rem;
		margin: 1rem 0;
	}

	.location-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.875rem;
		border: 2px dashed var(--color-linea, #e2e8f0);
		border-radius: 12px;
		background: #fff;
		color: var(--color-tinta, #143d48);
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		margin-top: 0.5rem;
	}

	.location-btn:hover {
		border-color: var(--color-petroleo, #0f4c5c);
		background: #f0f7fa;
	}

	.location-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.emergency-callout {
		background: #f8fafc;
		border: 1px solid var(--color-linea, #e2e8f0);
		border-radius: 12px;
		padding: 1rem;
		margin-top: 1.5rem;
	}

	.emergency-callout strong {
		display: block;
		color: var(--color-tinta, #143d48);
		font-size: 0.95rem;
		margin-bottom: 0.5rem;
	}

	.emergency-callout p {
		color: #6b7280;
		font-size: 0.875rem;
		margin: 0 0 0.75rem;
	}

	.emergency-numbers {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 0.75rem;
	}

	.emergency-phone-link {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.875rem;
		background: #fff;
		border: 2px solid var(--color-rojo-claro, #fde7ea);
		border-radius: 12px;
		color: var(--color-rojo-osc, #a3142a);
		font-weight: 800;
		text-decoration: none;
		transition: all 0.2s;
	}

	.emergency-phone-link span {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.emergency-phone-link:hover {
		background: var(--color-rojo-claro, #fde7ea);
		border-color: var(--color-rojo, #d7263d);
	}

	.guardian-section {
		background: #fff3f3;
		border-color: var(--color-rojo-claro, #fde7ea);
	}

	.guardian-item {
		background: #fff;
		border: 1px solid var(--color-linea, #e2e8f0);
		border-radius: 12px;
		padding: 1rem;
		margin-top: 0.75rem;
	}

	.guardian-item--danger {
		border-left: 4px solid var(--color-rojo, #d7263d);
	}

	.guardian-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.section-heading {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 1.5rem;
	}

	.section-heading h2 {
		font-size: 1.125rem;
		font-weight: 800;
		color: var(--color-tinta, #143d48);
		margin: 0;
	}

	.section-heading p {
		color: #6b7280;
		font-size: 0.875rem;
		margin: 0.25rem 0 0;
	}

	.text-button {
		background: none;
		border: none;
		color: var(--color-petroleo, #0f4c5c);
		font-weight: 700;
		cursor: pointer;
		padding: 0.5rem 1rem;
		border-radius: 8px;
		transition: background 0.2s;
	}

	.text-button:hover {
		background: #f0f7fa;
	}

	.map-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.map-list__button {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.875rem;
		background: #fff;
		border: 1px solid var(--color-linea, #e2e8f0);
		border-radius: 12px;
		cursor: pointer;
		font-size: 0.9rem;
		transition: all 0.2s;
	}

	.map-list__button:hover {
		background: #f8fafc;
		border-color: var(--color-petroleo, #0f4c5c);
	}

	.map-list__icon {
		width: 32px;
		height: 32px;
		border-radius: 8px;
		background: #f8fafc;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.25rem;
		color: var(--color-rojo, #d7263d);
	}

	.map-list__button small {
		color: #6b7280;
		font-size: 0.75rem;
		display: block;
		margin-top: 0.125rem;
	}

	.empty,
	.muted {
		text-align: center;
		color: #9ca3af;
		font-size: 0.9rem;
		padding: 2rem;
	}

	.feedback {
		padding: 1rem;
		border-radius: 12px;
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #991b1b;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.feedback button {
		background: none;
		border: none;
		color: #dc2626;
		font-weight: 700;
		cursor: pointer;
		font-size: 0.875rem;
		padding: 0.25rem 0.5rem;
	}

	.emergency-success {
		text-align: center;
		padding: 3rem 1rem;
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		border-radius: 20px;
	}

	.success-icon {
		font-size: 4rem;
		color: #16a34a;
		margin-bottom: 1rem;
	}

	.emergency-success h2 {
		font-size: 1.75rem;
		font-weight: 800;
		color: var(--color-tinta, #143d48);
		margin: 0 0 0.75rem;
	}

	.codigo {
		font-size: 1.5rem;
		font-weight: 900;
		color: #16a34a;
		margin: 0.5rem 0;
		font-family: monospace;
	}

	.explicacion {
		color: #6b7280;
		margin: 0 0 1.5rem;
		font-size: 0.95rem;
	}

	.acciones-confirmado {
		display: flex;
		gap: 0.75rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.emergency-mapa-view {
		text-align: center;
		padding: 2rem 1rem;
	}

	.emergency-mapa-view h2 {
		font-size: 1.5rem;
		font-weight: 800;
		color: var(--color-tinta, #143d48);
		margin: 0 0 0.5rem;
	}

	.subtitulo {
		color: #6b7280;
		margin: 0 0 1.5rem;
	}

	.leyenda-mapa {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.75rem;
		margin-top: 1rem;
	}

	.leyenda-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: #4b5563;
	}

	.leyenda-icon {
		font-size: 1.25rem;
	}

	@media (min-width: 768px) {
		.emergency-page {
			max-width: 900px;
			margin: 0 auto;
		}
	}
</style>
