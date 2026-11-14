<!-- Botones grandes con ícono y texto (tipo de emergencia, necesidades, etiquetas). -->
<script>
  const TONO = {
    morado: 'border-morado bg-morado-claro text-morado-osc',
    rojo: 'border-rojo bg-rojo-claro text-rojo-osc',
    petroleo: 'border-petroleo bg-petroleo-claro text-petroleo-osc',
  };
  const COLS = { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' };
  let { options, value, onChange, multi = false, cols = 3, tone = 'morado' } = $props();
  const isOn = (id) => (multi ? value.includes(id) : value === id);
  const toggle = (id) => {
    if (!multi) return onChange(id);
    return onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };
</script>

<div class="grid gap-2.5 {COLS[cols]}">
  {#each options as o (o.id)}
    <button
      type="button"
      aria-pressed={isOn(o.id)}
      onclick={() => toggle(o.id)}
      class="flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-2xl border-2 px-1 text-center text-xs font-extrabold leading-tight {isOn(o.id) ? TONO[tone] : 'border-linea bg-white text-tinta'}">
      <span class="text-2xl" aria-hidden="true">{o.emoji}</span>
      {o.label}
    </button>
  {/each}
</div>
