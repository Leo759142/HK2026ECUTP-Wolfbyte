<script lang="ts">
	import { onMount } from 'svelte';
	import PhotoPicker from '../../lib/ui/PhotoPicker.svelte';

	type Usuario = {
		id?: string;
		firstName?: string;
		lastName?: string;
		manzana?: string;
		foto?: string | null;
		createdAt?: number;
		inviteAnswered?: 'aceptada' | 'despues' | null;
	};

	const PREFIJO = 'ayni:v1:';
	let usuario = $state<Usuario>({});
	let foto = $state<string | null>(null);
	let idioma = $state('es');
	let letraGrande = $state(false);
	let mensaje = $state('');
	let error = $state('');
	let publicaciones = $state(0);
	let favoresDados = $state(0);
	let favoresRecibidos = $state(0);
	let diasEnAyni = $state(0);
	let esGuardian = $state(false);
	let puedeSerGuardian = $state(false);

	function leer<T>(clave: string, fallback: T): T {
		try {
			const raw = localStorage.getItem(PREFIJO + clave);
			return raw ? (JSON.parse(raw) as T) : fallback;
		} catch {
			return fallback;
		}
	}

	function guardar(clave: string, valor: unknown) {
		localStorage.setItem(PREFIJO + clave, JSON.stringify(valor));
	}

	function nombre() {
		return `${usuario.firstName ?? 'Vecino'} ${usuario.lastName ?? ''}`.trim();
	}

	function nombreVisible() {
		const primero = usuario.firstName ?? 'Vecino';
		const inicialApellido = usuario.lastName?.trim()?.[0];
		return inicialApellido ? `${primero} ${inicialApellido}.` : primero;
	}

	function inicial() {
		return (usuario.firstName?.[0] ?? 'A').toUpperCase();
	}

	function comprimirImagen(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const lector = new FileReader();
			lector.onerror = () => reject(new Error('No se pudo leer la imagen'));
			lector.onload = () => {
				const imagen = new Image();
				imagen.onerror = () => reject(new Error('La imagen no es válida'));
				imagen.onload = () => {
					const maximo = 480;
					const escala = Math.min(1, maximo / Math.max(imagen.width, imagen.height));
					const canvas = document.createElement('canvas');
					canvas.width = Math.max(1, Math.round(imagen.width * escala));
					canvas.height = Math.max(1, Math.round(imagen.height * escala));
					const contexto = canvas.getContext('2d');
					if (!contexto) {
						reject(new Error('El navegador no permite procesar la imagen'));
						return;
					}
					contexto.drawImage(imagen, 0, 0, canvas.width, canvas.height);
					resolve(canvas.toDataURL('image/jpeg', 0.72));
				};
				imagen.src = String(lector.result);
			};
			lector.readAsDataURL(file);
		});
	}

	async function cambiarFoto(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const archivo = input.files?.[0];
		if (!archivo) return;
		error = '';
		mensaje = '';
		try {
			foto = await comprimirImagen(archivo);
			usuario = { ...usuario, foto };
			const usuarios = leer<Usuario[]>('users', []);
			const actualizados = usuarios.map((item, index) =>
				index === 0 ? { ...item, foto, updatedAt: Date.now() } : item
			);
			guardar('users', actualizados);
			mensaje = 'Foto de perfil actualizada.';
		} catch (cause) {
			error = cause instanceof Error ? cause.message : 'No se pudo actualizar la foto.';
		} finally {
			input.value = '';
		}
	}

	function quitarFoto() {
		foto = null;
		usuario = { ...usuario, foto: null };
		const usuarios = leer<Usuario[]>('users', []);
		guardar(
			'users',
			usuarios.map((item, index) =>
				index === 0 ? { ...item, foto: null, updatedAt: Date.now() } : item
			)
		);
		mensaje = 'Foto de perfil eliminada.';
	}

	function guardarFoto(valor: string | null) {
		foto = valor;
		usuario = { ...usuario, foto: valor };
		const usuarios = leer<Usuario[]>('users', []);
		guardar(
			'users',
			usuarios.map((item, index) =>
				index === 0 ? { ...item, foto: valor, updatedAt: Date.now() } : item
			)
		);
		mensaje = valor ? 'Foto de perfil actualizada.' : 'Foto de perfil eliminada.';
	}

	function cambiarIdioma(valor: string) {
		idioma = valor;
		guardar('settings', { ...leer('settings', {}), lang: valor });
		document.documentElement.lang = valor;
	}

	function cambiarLetraGrande(valor: boolean) {
		letraGrande = valor;
		guardar('settings', { ...leer('settings', {}), largeText: valor });
		document.documentElement.classList.toggle('letra-grande', valor);
	}

	function leerLista<T>(clave: string): T[] {
		return leer<T[]>(clave, []);
	}

	onMount(() => {
		const usuarios = leerLista<Usuario>('users');
		const sesion = leer<{ usuarioId?: string }>('session', {});
		usuario = usuarios.find((item) => item.id === sesion.usuarioId) ?? usuarios[0] ?? {};
		foto = usuario.foto ?? null;
		const userId = usuario.id;
		diasEnAyni = usuario.createdAt
			? Math.max(0, Math.floor((Date.now() - usuario.createdAt) / (24 * 60 * 60 * 1000)))
			: 0;
		puedeSerGuardian = diasEnAyni >= 60 && usuario.inviteAnswered !== 'despues';
		const sectores = leer<Array<{ guardianIds?: string[] }>>('sectors', []);
		esGuardian = sectores.some((sector) => sector.guardianIds?.includes(userId ?? ''));
		const servicios = leer<Array<{ ownerId?: string; usuario_id?: string }>>('services', []);
		const favores = leer<
			Array<{
				ownerId?: string;
				creador_id?: string;
				takerId?: string;
				ayudante_id?: string;
				status?: string;
				estado?: string;
			}>
		>('favors', []);
		publicaciones =
			servicios.filter((item) => item.ownerId === userId || item.usuario_id === userId).length +
			favores.filter((item) => item.ownerId === userId || item.creador_id === userId).length;
		favoresDados = favores.filter(
			(item) => item.ownerId === userId || item.creador_id === userId
		).length;
		favoresRecibidos = favores.filter(
			(item) => item.takerId === userId || item.ayudante_id === userId
		).length;
		const ajustes = leer<{ lang?: string; largeText?: boolean }>('settings', {});
		idioma = ajustes.lang ?? 'es';
		letraGrande = Boolean(ajustes.largeText);
		document.documentElement.lang = idioma;
		document.documentElement.classList.toggle('letra-grande', letraGrande);
	});

	function cerrarSesion() {
		localStorage.removeItem('ayni:v1:session');
		window.location.href = '/acceso';
	}
</script>

<svelte:head><title>Perfil | AYNI</title></svelte:head>

<section class="profile">
	<div class="profile__hero">
		<div class="profile__photo-wrap">
			{#if foto}
				<img class="profile__photo" src={foto} alt={`Foto de ${nombre()}`} />
			{:else}
				<div class="profile__photo profile__photo--fallback" aria-hidden="true">{inicial()}</div>
			{/if}
			<label class="profile__camera" aria-label="Cambiar foto de perfil">
				<span aria-hidden="true">📷</span>
				<input type="file" accept="image/*" onchange={cambiarFoto} />
			</label>
		</div>
		<h1>{nombreVisible()}</h1>
		<p>
			Vecino(a) de AYNI{#if usuario.manzana}
				· Mz. {usuario.manzana}{/if}
		</p>
	</div>

	<div class="profile__body">
		{#if mensaje}<p class="notice notice--ok" role="status">{mensaje}</p>{/if}
		{#if error}<p class="notice notice--error" role="alert">{error}</p>{/if}

		<section class="profile-card">
			<h2>🤝 Tu balance de Ayni</h2>
			<div class="profile-stats">
				<div><strong>{favoresDados}</strong><small>Favores dados</small></div>
				<div><strong>{favoresRecibidos}</strong><small>Favores recibidos</small></div>
			</div>
		</section>

		{#if !esGuardian}
			<section class="profile-card guardian-card">
				<div class="profile-card__heading">
					<h2>🛡️ Camino a Guardián</h2>
					<span>{Math.min(100, Math.round((diasEnAyni / 60) * 100))}%</span>
				</div>
				<div class="guardian-progress">
					<span style={`width: ${Math.min(100, Math.round((diasEnAyni / 60) * 100))}%`}></span>
				</div>
				<p>
					{puedeSerGuardian
						? 'Ya cumples los 2 meses. ¡Puedes ser Guardián!'
						: `Llevas ${diasEnAyni} días en AYNI. Te invitaremos al cumplir 2 meses.`}
				</p>
				{#if puedeSerGuardian}
					<a class="mobile-btn mobile-btn--primary" href="/perfil/guardian/invitacion"
						>Quiero ser Guardián</a
					>
				{/if}
			</section>
		{:else}
			<section class="profile-card guardian-card">
				<div class="profile-card__heading">
					<h2>🛡️ Eres Guardián</h2>
					<span>Activo</span>
				</div>
				<p>Ayudas a confirmar emergencias y mantener segura la comunidad.</p>
				<a class="mobile-btn mobile-btn--primary" href="/perfil/guardian"
					>Abrir panel del Guardián</a
				>
			</section>
		{/if}

		<div class="profile-stat-single">
			<strong>{publicaciones}</strong><small>Publicaciones activas</small>
		</div>

		<section class="profile-card">
			<h2>Foto de perfil</h2>
			<p>Usa una imagen clara para que tus vecinos puedan reconocerte.</p>
			<PhotoPicker value={foto} onchange={guardarFoto} />
		</section>

		<section class="profile-card">
			<h2>Idioma y lectura</h2>
			<label class="setting-row">
				<span>Idioma</span>
				<select
					value={idioma}
					onchange={(event) => cambiarIdioma((event.currentTarget as HTMLSelectElement).value)}
				>
					<option value="es">Español</option>
					<option value="en">English</option>
					<option value="qu">Runasimi</option>
				</select>
			</label>
			<label class="setting-row">
				<span>Letra grande</span>
				<input
					type="checkbox"
					checked={letraGrande}
					onchange={(event) =>
						cambiarLetraGrande((event.currentTarget as HTMLInputElement).checked)}
				/>
			</label>
		</section>

		<a class="profile-link" href="/perfil/publicaciones"
			>📋 Mis publicaciones <span aria-hidden="true">›</span></a
		>
		<a class="profile-link" href="/perfil/ajustes"
			>⚙️ Idioma, letra grande y zona <span aria-hidden="true">›</span></a
		>
		<a class="profile-link" href="/mapa">🗺️ Ver mi zona <span aria-hidden="true">›</span></a>
		<button class="profile-link profile-link--button" type="button" onclick={cerrarSesion}
			>🚪 Cerrar sesión <span aria-hidden="true">›</span></button
		>
	</div>
</section>
