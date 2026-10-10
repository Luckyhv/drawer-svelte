<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { getDrawerContext } from './state.svelte.js';

	type Props = HTMLAttributes<HTMLDivElement> & {
		/** Backdrop blur: `true` (8px) or a px number. */
		blur?: boolean | number;
	};

	let { style = '', blur = false, ...rest }: Props = $props();
	const drawer = getDrawerContext();
	const blurPx = $derived(blur === true ? 8 : typeof blur === 'number' ? blur : 0);
</script>

<!-- Modal drawers only: a non-modal drawer leaves the page usable. -->
{#if drawer.mounted && drawer.modal}
	<div
		{...rest}
		bind:this={drawer.overlayEl}
		style="{drawer.overlayStyle}{blurPx
			? ` backdrop-filter: blur(${blurPx}px); -webkit-backdrop-filter: blur(${blurPx}px);`
			: ''}{drawer.colorVars ? ` ${drawer.colorVars};` : ''}{style ? ` ${style}` : ''}"
		data-drawer-overlay
		data-drawer-theme={drawer.theme}
		data-state={drawer.state}
		aria-hidden="true"
		onpointerdown={drawer.onOverlayPointerDown}
	></div>
{/if}
