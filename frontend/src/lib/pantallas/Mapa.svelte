<!-- 3.2 Mapa del sector. Modo normal: servicios y favores. En emergencia: pedidos de ayuda y puntos de apoyo, con "Voy yo".
     Privacidad: el teléfono de quien pide solo lo recibe quien acepta ayudar; la dirección exacta, solo los Guardianes. -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { app, datos } from '../estado.svelte.js';
  import { TIPOS_FAVOR, VULNERABLES, catById, emergenciaById, necesidadById } from '../data.js';
  import { hace, nombreVisible, posicionPin } from '../util.js';
  import { ayudarPedido } from '../acciones.js';
  import { GeoLocationService } from '../servicios/geoService';
  import type { UserLocation } from '../types/poi';
  import Btn from '../ui/Btn.svelte';
  import Chip from '../ui/Chip.svelte';
  import EmergencyBanner from '../ui/EmergencyBanner.svelte';
  import H1 from '../ui/H1.svelte';
  import LinkBtn from '../ui/LinkBtn.svelte';
  import Screen from '../ui/Screen.svelte';
  import MapaOSM from '../ui/MapaOSM.svelte';
  import { serviciosVisibles } from './servicios/comun.js';

  let sel = $state(null);
  const e = $derived(app.activeEmergency);
  const manzanas = $derived(app.sector?.manzanas ?? ['A', 'B', 'C', 'D', 'E', 'F']);
  const cols = $derived(manzanas.length <= 4 ? 2 : 3);
  const ownerOf = (id) => app.users.find((u) => u.id === id);
  const pedidos = $derived(e ? datos.needs.filter((n) => n.emergencyId === e.id && n.status !== 'resuelto') : []);
  const pins = $derived(
    e
      ? [
          ...pedidos.map((n) => ({ id: n.id, kind: 'need', emoji: necesidadById(n.necesidad).emoji, manzana: n.manzana, cls: 'bg-rojo', ring: true })),
          ...datos.groups.map((g) => ({ id: g.id, kind: 'group', emoji: g.emoji, manzana: g.manzana, cls: g.recurso === 'agua' ? 'bg-petroleo-osc' : 'bg-petroleo' })),
        ]
      : [
          ...serviciosVisibles(app.user).map((s) => ({ id: s.id, kind: 'service', emoji: catById(s.categoria).emoji, manzana: s.owner?.manzana, cls: 'bg-petroleo' })),
          ...datos.favors.filter((f) => !f.hidden && f.status === 'disponible').map((f) => ({ id: f.id, kind: 'favor', emoji: TIPOS_FAVOR[f.tipo].emoji, manzana: ownerOf(f.ownerId)?.manzana, cls: 'bg-morado' })),
        ]
  );
  const miPos = $derived(posicionPin(manzanas, app.user.manzana, 'yo', cols));
  const seleccionado = $derived(pins.find((p) => p.id === sel));
  const ordenados = $derived([...pedidos].sort((a, b) => (a.id === sel ? -1 : b.id === sel ? 1 : a.status === 'abierto' ? -1 : 1)));

  /* ---------- Vista geográfica (OSM) ---------- */
  let vistaGeo = $state(false);
  let userLocation: UserLocation | null = $state(null);
  let geoPins = $derived(
    pins.map((p) => {
      const owner = p.manzana ? app.users.find((u) => u.manzana === p.manzana && u.id !== app.user?.id) : null;
      const ref = owner ?? app.user;
      const base = ref ? (ref.lat_aprox ?? userLocation?.coords?.lat ?? -12.046374) : (userLocation?.coords?.lat ?? -12.046374);
      const baseLng = ref ? (ref.lng_aprox ?? userLocation?.coords?.lng ?? -77.042793) : (userLocation?.coords?.lng ?? -77.042793);
      const manzanaIdx = manzanas.indexOf(p.manzana ?? 'A');
      const offsetLat = ((manzanaIdx * 7) % 10 - 5) * 0.0015;
      const offsetLng = ((manzanaIdx * 13) % 10 - 5) * 0.0015;
      return {
        id: p.id,
        kind: p.kind,
        lat: base + offsetLat,
        lng: baseLng + offsetLng,
        emoji: p.emoji,
        label: p.id,
      };
    })
  );

  async function initGeo() {
    try {
      const cached = GeoLocationService.getCachedLocation();
      if (cached) {
        userLocation = cached;
      } else {
        const loc = await GeoLocationService.getIpLocation();
        userLocation = loc;
      }
    } catch {
      // Ignorar: se usa lat_aprox del usuario como fallback
    }
  }

  onMount(() => initGeo());

  function vengoYo(n) {
    ayudarPedido(n);
    app.notify(`🙋 Avisamos a ${ownerOf(n.ownerId)?.firstName} que vas en camino`);
  }
  const direccion = (d) => [d.direccion, d.referencia, d.distrito].filter(Boolean).join(' · ') || (d.lat_aprox != null ? `${d.lat_aprox}, ${d.lng_aprox}` : '');
</script>

<div class="flex flex-1 flex-col {e ? 'bg-rojo-fondo' : ''}">
  {#if e}<EmergencyBanner emergencia={e} tipo={emergenciaById(e.tipo)} />{/if}

  <!-- Selector de vista: esquema por manzanas / mapa geográfico -->
  <div class="mx-5 mt-2 flex items-center gap-2">
    <button
      type="button"
      onclick={() => (vistaGeo = false)}
      class="px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all {vistaGeo ? 'text-gris bg-slate-100' : 'text-petroleo bg-petroleo-claro'}"
    >
      🗺️ Manzanas
    </button>
    <button
      type="button"
      onclick={() => (vistaGeo = true)}
      class="px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all {vistaGeo ? 'text-petroleo bg-petroleo-claro' : 'text-gris bg-slate-100'}"
    >
      🌍 Geográfico
    </button>
    {#if !vistaGeo && userLocation}
      <LinkBtn class="text-[10px]" onclick={() => { userLocation = null; }}>(Ignorar ubicación)</LinkBtn>
    {/if}
  </div>

  {#if !vistaGeo}
    <div class="relative mx-5 mt-4 h-[min(340px,45dvh)] overflow-hidden rounded-3xl bg-mapa" role="img" aria-label="Mapa del sector por manzanas">
    <div class="absolute inset-3 grid gap-3 {cols === 3 ? 'grid-cols-3' : 'grid-cols-2'}">
      {#each manzanas as m (m)}
        <div class="flex items-start justify-start rounded-lg p-1.5 text-[11px] font-extrabold {m === app.user.manzana ? 'bg-petroleo-claro text-petroleo-osc' : 'bg-manzana text-gris'}">Mz. {m}</div>
      {/each}
    </div>
    <span class="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-[#2F80ED] shadow-[0_0_0_8px_rgba(47,128,237,.2)]" style="left: {miPos.left}%; top: {miPos.top}%" aria-label="Tú estás aquí"></span>
    {#each pins as p (p.id)}
      {@const pos = posicionPin(manzanas, p.manzana, p.id, cols)}
      <button type="button" onclick={() => (sel = p.id)} aria-label="Ver detalle" class="absolute -translate-x-1/2 -translate-y-1/2" style="left: {pos.left}%; top: {pos.top}%">
        {#if p.ring}<span class="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-rojo bg-rojo/15"></span>{/if}
        <span class="relative flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-white text-lg shadow-md {p.cls} {sel === p.id ? 'scale-125' : ''}">{p.emoji}</span>
      </button>
    {/each}
    {#if e}<span class="absolute right-3 top-3 rounded-xl bg-white px-2.5 py-1.5 text-xs font-extrabold">🔒 Zona aproximada</span>{/if}
  </div>
  {/if}

  {#if vistaGeo}
    <div class="mx-5 mt-4 h-[min(340px,45dvh)]">
      <MapaOSM
        {userLocation}
        pins={geoPins}
        selectedPinId={sel}
        onPinClick={(id) => (sel = id)}
        centerOnUser
      />
    </div>
  {/if}

  <Screen class="gap-3">
    <div class="flex flex-wrap gap-3 text-xs font-extrabold">
      {#if e}
        <span><span class="mr-1 inline-block h-3 w-3 rounded-full bg-rojo align-[-1px]"></span>Necesitan ayuda ({pedidos.filter((n) => n.status === 'abierto').length})</span>
        <span><span class="mr-1 inline-block h-3 w-3 rounded-full bg-petroleo align-[-1px]"></span>Apoyo ({datos.groups.length})</span>
      {:else}
        <span><span class="mr-1 inline-block h-3 w-3 rounded-full bg-petroleo align-[-1px]"></span>Servicios</span>
        <span><span class="mr-1 inline-block h-3 w-3 rounded-full bg-morado align-[-1px]"></span>Favores</span>
        <span><span class="mr-1 inline-block h-3 w-3 rounded-full bg-[#2F80ED] align-[-1px]"></span>Tú</span>
      {/if}
    </div>

    {#if !e && seleccionado}
      <Btn variant={seleccionado.kind === 'favor' ? 'acento' : 'primario'} onclick={() => app.go(seleccionado.kind === 'favor' ? 'favor' : 'servicio', { id: seleccionado.id })}>
        {seleccionado.emoji} Ver {seleccionado.kind === 'favor' ? 'favor' : 'servicio'}
      </Btn>
    {/if}
    {#if !e && !seleccionado}<p class="text-sm font-semibold text-gris">Toca un punto del mapa para ver de qué se trata.</p>{/if}

    {#if e}
      <H1 class="!text-xl">Vecinos que necesitan ayuda</H1>
      {#if pedidos.length === 0}<div class="rounded-2xl border border-linea bg-white p-4 font-semibold text-gris">🙌 Nadie ha pedido ayuda todavía.</div>{/if}
      {#each ordenados as n (n.id)}
        {@const nec = necesidadById(n.necesidad)}
        {@const helper = ownerOf(n.helperId)}
        {@const mio = n.ownerId === app.user.id}
        <div class="flex flex-col gap-2 rounded-[20px] border-2 bg-white p-3.5 {n.id === sel ? 'border-rojo' : 'border-linea'}">
          <div class="flex items-center gap-3">
            <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rojo-claro text-2xl" aria-hidden="true">{nec.emoji}</span>
            <div class="min-w-0 flex-1">
              <div class="font-black">{nec.label} · {n.cuantas} persona(s)</div>
              <div class="text-sm font-semibold text-gris">Zona Mz. {n.manzana} · {hace(n.createdAt)}</div>
            </div>
          </div>
          {#if n.quienes.length > 0}
            <div class="flex flex-wrap gap-1">
              {#each n.quienes as q (q)}
                {@const v = VULNERABLES.find((x) => x.id === q)}
                <Chip class="bg-rojo-claro text-rojo-osc">{v?.emoji} {v?.label}</Chip>
              {/each}
            </div>
          {/if}
          {#if n.texto}<p class="text-sm font-semibold">“{n.texto}”</p>{/if}
          {#if app.isGuardian && n.direccionExacta && direccion(n.direccionExacta)}
            <p class="rounded-xl bg-morado-claro p-2 text-xs font-bold text-morado-osc">🛡️ Solo Guardianes · {direccion(n.direccionExacta)}</p>
          {/if}
          {#if mio}
            <Btn variant="borde" class="!min-h-[48px] !text-base" onclick={() => app.go('miPedido', { id: n.id })}>Ver mi pedido</Btn>
          {:else if n.status === 'abierto'}
            <Btn variant="rojo" class="!min-h-[48px] !text-base" onclick={() => vengoYo(n)}>🙋 Voy yo</Btn>
          {:else}
            <div class="text-sm font-extrabold text-petroleo">🙋 {helper?.id === app.user.id ? 'Tú vas' : `${nombreVisible(helper)} va`} en camino</div>
            {#if helper?.id === app.user.id && n.contactPhone}
              <a href="tel:+{n.contactPhone}" class="flex min-h-[48px] items-center justify-center rounded-2xl border-2 border-linea bg-white font-black">📞 Llamar</a>
            {/if}
          {/if}
        </div>
      {/each}
    {/if}
  </Screen>
</div>
