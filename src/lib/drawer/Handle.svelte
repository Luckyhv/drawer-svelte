<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { getDrawerContext } from './state.svelte.js';

	/**
	 * A grab area. Drags always start here, even with `handleOnly`. Without
	 * children it draws a bar, horizontal for top/bottom drawers and vertical
	 * for side drawers.
	 */
	let { style = '', children, ...rest }: HTMLAttributes<HTMLDivElement> = $props();
	const drawer = getDrawerContext();
</script>

<div
	{...rest}
	style="touch-action: none; cursor: grab;{style ? ` ${style}` : ''}"
	data-drawer-handle
	data-direction={drawer.direction}
>
	{#if children}
		{@render children()}
	{:else}
		<div data-drawer-handle-bar aria-hidden="true"></div>
	{/if}
</div>
