<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { getDrawerContext } from './state.svelte.js';

	type Props = HTMLAttributes<HTMLDivElement> & {
		ref?: HTMLElement | null;
		/**
		 * Preset look from `@luckyhv/drawer-svelte/styles.css` (import it once). Leave unset
		 * to style it yourself; the drawer is headless by default.
		 */
		variant?: 'sheet' | 'floating' | 'side';
	};

	let { style = '', children, ref = $bindable(null), variant, ...rest }: Props = $props();
	const drawer = getDrawerContext();

	$effect(() => {
		ref = drawer.contentEl;
	});
</script>

{#if drawer.mounted}
	<div
		{...rest}
		bind:this={drawer.contentEl}
		{@attach drawer.gestures}
		style="{drawer.contentStyle}{drawer.colorVars ? `; ${drawer.colorVars}` : ''}{style
			? `; ${style}`
			: ''}"
		id={drawer.id}
		role="dialog"
		aria-modal={drawer.modal ? 'true' : undefined}
		aria-labelledby={drawer.titleId}
		aria-describedby={drawer.descriptionId}
		tabindex="-1"
		data-drawer-content
		data-drawer-theme={drawer.theme}
		data-variant={variant}
		data-direction={drawer.direction}
		data-state={drawer.state}
		data-dragging={drawer.dragging ? '' : undefined}
		data-snap={drawer.hasSnaps ? drawer.activeSnap : undefined}
	>
		{@render children?.()}
	</div>
{/if}
