<script lang="ts">
  import { Star } from 'lucide-svelte';

  export let rating: number = 5;
  export let maxStars: number = 5;
  export let size: 'xs' | 'sm' | 'md' | 'lg' = 'sm';
  export let showNumber: boolean = false;
  export let showCount: boolean = false;
  export let reviewsCount: number | undefined = undefined;
  export let interactive: boolean = false;
  export let onRatingChange: ((newRating: number) => void) | undefined = undefined;

  $: safeRating = Math.max(0, Math.min(5, typeof rating === 'number' && !isNaN(rating) ? rating : 5));

  $: starSizePx = size === 'xs' ? 12 : size === 'sm' ? 14 : size === 'md' ? 16 : 20;

  function handleClick(val: number) {
    if (interactive && onRatingChange) {
      onRatingChange(val);
    }
  }
</script>

<div class="inline-flex items-center gap-1 select-none" aria-label="Calificación {safeRating.toFixed(1)} de 5 estrellas">
  <div class="flex items-center">
    {#each Array(maxStars) as _, idx}
      {@const starIndex = idx + 1}
      {@const isFull = safeRating >= starIndex}
      {@const isHalf = !isFull && safeRating >= starIndex - 0.5}

      <button
        type="button"
        disabled={!interactive}
        on:click={() => handleClick(starIndex)}
        class="p-0.5 transition-transform {interactive ? 'cursor-pointer hover:scale-125 focus:outline-none' : 'cursor-default pointer-events-none'}"
      >
        {#if isFull}
          <Star size={starSizePx} class="fill-amber-400 text-amber-400 drop-shadow-sm" />
        {:else if isHalf}
          <div class="relative inline-block">
            <Star size={starSizePx} class="text-slate-600" />
            <div class="absolute inset-0 overflow-hidden w-1/2">
              <Star size={starSizePx} class="fill-amber-400 text-amber-400" />
            </div>
          </div>
        {:else}
          <Star size={starSizePx} class="text-slate-600 fill-slate-800/60" />
        {/if}
      </button>
    {/each}
  </div>

  {#if showNumber}
    <span class="font-bold text-white text-xs font-mono ml-0.5">
      {safeRating.toFixed(1)}
    </span>
  {/if}

  {#if showCount && reviewsCount !== undefined}
    <span class="text-[11px] text-slate-400">
      ({reviewsCount})
    </span>
  {/if}
</div>
