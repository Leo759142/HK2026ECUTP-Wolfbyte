<script>
  const BOTON = {
    primario: 'bg-petroleo text-white',
    acento: 'bg-morado text-white',
    rojo: 'bg-rojo text-white',
    borde: 'bg-white text-tinta border-2 border-linea',
    wa: 'bg-wa text-white',
    blanco: 'bg-white text-petroleo',
    bordeBlanco: 'bg-transparent text-white border-2 border-white',
  };
  let { variant = 'primario', class: clase = '', type = 'button', children, ...resto } = $props();
</script>

<button
  {type}
  class="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl px-4 text-lg font-black leading-tight transition active:scale-[.98] disabled:opacity-40 disabled:active:scale-100 {BOTON[variant]} {clase}"
  {...resto}>{@render children?.()}</button>
