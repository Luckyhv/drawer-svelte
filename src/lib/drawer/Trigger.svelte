<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { getDrawerContext } from './state.svelte.js';

	let { children, onclick, ...rest }: HTMLButtonAttributes = $props();
	const drawer = getDrawerContext();
</script>

<button
	type="button"
	{...rest}
	aria-haspopup="dialog"
	aria-expanded={drawer.state === 'open'}
	aria-controls={drawer.id}
	data-state={drawer.state}
	onclick={(e) => {
		onclick?.(e);
		if (!e.defaultPrevented) drawer.toggle();
	}}>{@render children?.()}</button
>
