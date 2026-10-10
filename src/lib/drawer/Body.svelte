<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	/**
	 * Optional scroll area. Pulling down at its top drags the drawer; the
	 * bottom padding keeps content below the screen (at a smaller snap point)
	 * reachable.
	 */
	let { style = '', children, ...rest }: HTMLAttributes<HTMLDivElement> = $props();
</script>

<div
	{...rest}
	data-drawer-body
	style="flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: none; padding-bottom: calc(var(--drawer-body-pad, 0px) + var(--drawer-hidden, 0px));{style
		? ` ${style}`
		: ''}"
>
	{@render children?.()}
</div>
