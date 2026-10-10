<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { getDrawerContext } from './state.svelte.js';

	let { children, onclick, ...rest }: HTMLButtonAttributes = $props();
	const drawer = getDrawerContext();
</script>

<button
	type="button"
	{...rest}
	onclick={(e) => {
		onclick?.(e);
		if (!e.defaultPrevented) drawer.close();
	}}>{@render children?.()}</button
>
