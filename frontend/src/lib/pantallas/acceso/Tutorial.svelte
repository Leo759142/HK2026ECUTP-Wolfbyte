<!-- 1.1–1.3 Tutorial -->
<script>
  import { app } from '../../estado.svelte.js';
  import Btn from '../../ui/Btn.svelte';

  let { desdePerfil = false } = $props();
  const PASOS = [
    { emoji: '🤝', titulo: 'Hoy por ti,\nmañana por mí', texto: 'Encuentra gasfiteros, profes y más, recomendados por tus propios vecinos.', fondo: 'bg-petroleo' },
    { emoji: '🔄', titulo: 'Pide o presta\nsin dinero', texto: 'Presta tu escalera, regala lo que te sobra o intercambia lo que sabes hacer.', fondo: 'bg-petroleo' },
    { emoji: '🛡️', titulo: 'En emergencias,\nnos cuidamos', texto: 'Si pasa algo grave, AYNI cambia a modo emergencia para coordinar ayuda entre vecinos.', fondo: 'bg-rojo' },
  ];
  let paso = $state(0);
  const p = $derived(PASOS[paso]);
  const terminar = () => (desdePerfil ? app.back() : app.go('telefono', { mode: 'registro' }));
</script>

<div class="flex flex-1 flex-col gap-6 px-7 pb-10 pt-5 text-white {p.fondo}">
  <button type="button" onclick={terminar} class="min-h-[48px] self-end text-base font-extrabold opacity-85">Saltar</button>
  <div class="flex h-64 items-center justify-center rounded-[32px] bg-white/15">
    <div class="flex h-28 w-28 items-center justify-center rounded-full bg-white text-6xl" aria-hidden="true">{p.emoji}</div>
  </div>
  <div class="flex flex-col gap-3">
    <h1 class="whitespace-pre-line text-3xl font-black leading-tight">{p.titulo}</h1>
    <p class="text-lg font-semibold opacity-90">{p.texto}</p>
  </div>
  <div class="flex-1"></div>
  <div class="flex justify-center gap-2" aria-label="Paso {paso + 1} de 3">
    {#each PASOS as _, i (i)}
      <span class="h-2.5 rounded-full {i === paso ? 'w-7 bg-white' : 'w-2.5 bg-white/40'}"></span>
    {/each}
  </div>
  <Btn variant="blanco" class={paso === 2 ? '!text-rojo' : ''} onclick={() => (paso < 2 ? (paso += 1) : terminar())}>
    {paso < 2 ? 'Siguiente →' : desdePerfil ? 'Listo' : 'Empezar'}
  </Btn>
</div>
