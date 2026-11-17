<script lang="ts">
	let {
		value = $bindable(''),
		type = 'text',
		inputmode = undefined,
		maxlength = undefined,
		placeholder = '',
		label = '',
		ariaLabel = '',
		disabled = false,
		error = '',
		onEnter,
		class: className = '',
		...rest
	} = $props();

	function handleKeydown(event: KeyboardEvent) {
		if (disabled) return;
		if (event.key === 'Enter') {
			event.preventDefault();
			onEnter?.();
		}
	}
</script>

<label class={`ui-input ${className}`.trim()}>
	{#if label}
		<span class="ui-input__label">{label}</span>
	{/if}
	<input
		{type}
		{inputmode}
		{maxlength}
		{placeholder}
		{disabled}
		bind:value
		aria-label={ariaLabel || label || placeholder}
		aria-invalid={!!error}
		aria-describedby={error ? 'ui-input-error' : undefined}
		onkeydown={handleKeydown}
		{...rest}
	/>
	{#if error}
		<span id="ui-input-error" class="ui-input__error" role="alert">{error}</span>
	{/if}
</label>

<style>
	.ui-input {
		display: grid;
		gap: 6px;
		width: 100%;
	}
	.ui-input__label {
		font-size: 0.82rem;
		font-weight: 900;
		color: #143d48;
	}
	.ui-input input {
		min-height: 56px;
		width: 100%;
		border: 2px solid #eae3d6;
		border-radius: 16px;
		background: white;
		color: #143d48;
		font-size: 1rem;
		font-weight: 800;
		padding: 0 14px;
		outline: 0;
		box-sizing: border-box;
		transition: border-color 120ms ease;
	}
	.ui-input input:focus,
	.ui-input input:focus-visible {
		border-color: #7b2cbf;
		outline: 3px solid rgba(123, 44, 191, 0.25);
		outline-offset: 2px;
	}
	.ui-input input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.ui-input__error {
		color: #a3142a;
		font-size: 0.8rem;
		font-weight: 900;
	}
</style>
