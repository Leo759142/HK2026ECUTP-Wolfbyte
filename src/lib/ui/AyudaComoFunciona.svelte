<script lang="ts">
	import { gestorIdiomas } from '../../i18n';
	import { fade, scale } from 'svelte/transition';

	let { open = false, onClose } = $props();

	function handleKeydown(e: KeyboardEvent) {
		if (open && e.key === 'Escape') {
			onClose?.();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- Fondo oscuro con cierre al hacer clic afuera -->
	<div
		transition:fade={{ duration: 150 }}
		role="region"
		aria-label={gestorIdiomas.t('ayuda.titulo')}
		onclick={onClose}
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto"
	>
		<!-- Contenedor del modal (más ancho y espacioso) -->
		<div
			transition:scale={{ duration: 200, start: 0.96 }}
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-ayuda-titulo"
			onclick={(e) => e.stopPropagation()}
			class="relative mx-auto max-w-2xl w-full rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-linea/60 my-auto"
		>
			<!-- Cabecera fija con botón de cierre accesible -->
			<div class="flex items-start justify-between gap-4 mb-5">
				<div class="flex items-center gap-3.5">
					<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-petroleo/10 text-petroleo">
						<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
							<circle cx="12" cy="12" r="10" />
							<path d="M12 16v-4M12 8h.01" />
						</svg>
					</div>
					<div>
						<h3 id="modal-ayuda-titulo" class="text-xl sm:text-2xl font-black text-tinta tracking-tight">
							{gestorIdiomas.t('ayuda.titulo')}
						</h3>
					</div>
				</div>

				<button
					type="button"
					aria-label="Cerrar ayuda"
					onclick={onClose}
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-tinta transition-colors hover:bg-petroleo/10 hover:text-petroleo focus:outline-none focus:ring-2 focus:ring-petroleo/40 cursor-pointer"
				>
					<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<path d="M18 6L6 18M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Introducción con mejor legibilidad -->
			<p class="text-base text-gris leading-relaxed mb-6">
				{gestorIdiomas.t('ayuda.intro')}
			</p>

			<!-- Lista numerada con insignias visuales en lugar de texto plano -->
			<ol class="space-y-3 mb-6">
				{#each [
					gestorIdiomas.t('ayuda.puntoShell'),
					gestorIdiomas.t('ayuda.puntoDatos'),
					gestorIdiomas.t('ayuda.puntoCola'),
					gestorIdiomas.t('ayuda.puntoApi')
				] as punto, i}
					<li class="flex items-start gap-3.5 rounded-2xl bg-gray-50/90 p-3.5 sm:p-4 border border-linea/50 transition-colors hover:bg-gray-50">
						<span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-petroleo text-xs font-bold text-white shadow-sm mt-0.5">
							{i + 1}
						</span>
						<span class="text-sm sm:text-base text-tinta/90 leading-relaxed">
							{punto}
						</span>
					</li>
				{/each}
			</ol>

			<!-- Nota de consejo / prueba destacada -->
			<div class="flex items-start gap-3 rounded-2xl bg-petroleo/5 border border-petroleo/15 p-4 mb-6">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-petroleo shrink-0 mt-0.5" aria-hidden="true">
					<path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
				</svg>
				<p class="text-sm text-tinta/80 italic leading-relaxed">
					{gestorIdiomas.t('ayuda.probar')}
				</p>
			</div>

			<!-- Sección de advertencia / caché tipo Callout -->
			<div class="rounded-2xl bg-red-50/80 border border-red-200/80 p-4 sm:p-5 flex items-start gap-3.5">
				<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700">
					<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
						<line x1="12" y1="9" x2="12" y2="13" />
						<line x1="12" y1="17" x2="12.01" y2="17" />
					</svg>
				</div>
				<div class="space-y-1">
					<h4 class="text-xs sm:text-sm font-black text-red-900 uppercase tracking-wider">
						{gestorIdiomas.t('cache.titulo')}
					</h4>
					<p class="text-xs sm:text-sm text-red-800/90 leading-relaxed">
						{gestorIdiomas.t('cache.sensibles')}
					</p>
				</div>
			</div>

			<!-- Botón inferior de acción clara para cerrar -->
			<div class="mt-6 pt-4 border-t border-linea/60 flex justify-end">
				<button
					type="button"
					onclick={onClose}
					class="w-full sm:w-auto rounded-xl bg-petroleo px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:opacity-90 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-petroleo/50 cursor-pointer"
				>
					Entendido
				</button>
			</div>
		</div>
	</div>
{/if}
