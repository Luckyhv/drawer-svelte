<script lang="ts">
	import { onDestroy, untrack, type Snippet } from 'svelte';
	import {
		DEFAULT_EASE,
		DrawerState,
		setDrawerContext,
		type DrawerColors,
		type DrawerTheme
	} from './state.svelte.js';
	import type { Direction, SnapPoint } from './math.js';

	type Props = {
		open?: boolean;
		/** Which edge the drawer comes from. */
		direction?: Direction;
		/** Overlay + scroll lock + focus trap + Escape/overlay-click closing. */
		modal?: boolean;
		/** Allow closing by drag, Escape and overlay click. */
		dismissible?: boolean;
		/** Visible sizes: fractions of the viewport (0-1], px numbers, "300px" or (viewport) => px. */
		snapPoints?: SnapPoint[];
		/** Snap index used each time the drawer opens (when activeSnap isn't bound). */
		defaultSnap?: number;
		/** Bindable active snap index. */
		activeSnap?: number;
		closeThreshold?: number;
		velocityThreshold?: number;
		/** Only Drawer.Handle starts drags. */
		handleOnly?: boolean;
		/** Defaults to `modal`. */
		lockScroll?: boolean;
		restoreFocus?: boolean;
		keyboardAware?: boolean;
		/** Animation length in ms. */
		duration?: number;
		/** CSS timing function. */
		easing?: string;
		/** `translate` (default) slides a max-size sheet; `height` sizes it to the active snap (footer stays visible). */
		snapSizing?: 'translate' | 'height';
		/** Shrink the element marked `data-drawer-wrapper` behind a modal bottom drawer. */
		scaleBackground?: boolean;
		/** Recede slightly while another drawer is open on top of this one. */
		scaleNested?: boolean;
		/** Every flick moves exactly one snap, instead of travelling further the harder it is. */
		snapToSequentialPoint?: boolean;
		/** ms after the content last scrolled during which a touch scrolls instead of dragging. */
		scrollLockTimeout?: number;
		/** Colour scheme for the optional stylesheet (`auto` follows the OS or a `.dark` ancestor). */
		theme?: DrawerTheme;
		/** Colour overrides, e.g. `{ bg: '#111', fg: '#eee', accent: 'hotpink' }`. */
		colors?: DrawerColors;
		/** Remember open state (and snap) in localStorage under this key. */
		persistKey?: string;
		onOpenChange?: (open: boolean) => void;
		onSnapChange?: (index: number) => void;
		onAnimationEnd?: (open: boolean) => void;
		children?: Snippet;
	};

	let {
		open = $bindable(false),
		direction = 'bottom',
		modal = true,
		dismissible = true,
		snapPoints,
		defaultSnap = 0,
		activeSnap = $bindable(),
		closeThreshold = 0.25,
		velocityThreshold = 0.4,
		handleOnly = false,
		lockScroll,
		restoreFocus = true,
		keyboardAware = true,
		duration = 450,
		easing = DEFAULT_EASE,
		scaleBackground = false,
		scaleNested = true,
		snapToSequentialPoint = false,
		scrollLockTimeout = 100,
		snapSizing = 'translate',
		theme = 'auto',
		colors,
		persistKey,
		onOpenChange,
		onSnapChange,
		onAnimationEnd,
		children
	}: Props = $props();

	const reducedMotion =
		typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

	const id = $props.id();
	const drawer = new DrawerState(
		() => ({
			open,
			direction,
			modal,
			dismissible,
			snapPoints,
			defaultSnap,
			activeSnap,
			closeThreshold,
			velocityThreshold,
			handleOnly,
			lockScroll,
			restoreFocus,
			keyboardAware,
			duration: reducedMotion ? 0 : duration,
			easing,
			scaleBackground,
			scaleNested,
			snapToSequentialPoint,
			scrollLockTimeout,
			snapSizing,
			theme,
			colors
		}),
		{
			setOpen: (v) => (open = v),
			setActiveSnap: (i) => {
				if (activeSnap !== undefined) activeSnap = i;
			},
			onOpenChange: (v) => onOpenChange?.(v),
			onSnapChange: (i) => onSnapChange?.(i),
			onAnimationEnd: (v) => onAnimationEnd?.(v)
		},
		`drawer-${id}`
	);
	setDrawerContext(drawer);
	onDestroy(() => drawer.destroy());

	// Optional persistence: restore once (the key is read once), then mirror changes.
	const storageKey = untrack(() => (persistKey ? `drawer:${persistKey}` : null));
	if (storageKey && typeof localStorage !== 'undefined') {
		try {
			const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
			if (saved?.open) open = true;
			if (typeof saved?.snap === 'number' && activeSnap !== undefined) activeSnap = saved.snap;
		} catch {
			/* ignore corrupt entries */
		}
		$effect(() => {
			const value = JSON.stringify({ open, snap: drawer.activeSnap });
			try {
				localStorage.setItem(storageKey, value);
			} catch {
				/* storage full / blocked */
			}
		});
	}
</script>

{@render children?.()}
