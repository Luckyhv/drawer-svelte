import { flushSync } from 'svelte';
import { DrawerState, type DrawerProps, type DrawerCallbacks } from '../src/lib/drawer/state.svelte.js';

export function createDrawer(overrides: Partial<DrawerProps> = {}, callbacks: Partial<DrawerCallbacks> = {}) {
	const props = $state<DrawerProps>({
		open: true, direction: 'bottom', modal: true, dismissible: true,
		defaultSnap: 0, closeThreshold: 0.25, velocityThreshold: 0.4,
		handleOnly: false, restoreFocus: true, keyboardAware: true, duration: 450,
		easing: 'ease', scaleBackground: false, scaleNested: true,
		snapToSequentialPoint: false, scrollLockTimeout: 100, snapSizing: 'translate',
		theme: 'auto', ...overrides
	});
	let drawer!: DrawerState;
	const dispose = $effect.root(() => {
		drawer = new DrawerState(() => props, {
			setOpen: (value) => { props.open = value; },
			setActiveSnap: (value) => { if (props.activeSnap !== undefined) props.activeSnap = value; },
			...callbacks
		}, 'test-drawer');
	});
	flushSync();
	const el = document.createElement('div');
	el.setAttribute('data-drawer-content', '');
	el.tabIndex = -1;
	document.body.append(el);
	// The slide starts two frames after mounting; tests begin with it already open.
	const frame = globalThis.requestAnimationFrame;
	globalThis.requestAnimationFrame = (callback) => (callback(0), 0);
	drawer.contentEl = el;
	flushSync();
	globalThis.requestAnimationFrame = frame;
	flushSync();
	const detach = drawer.gestures(el);
	return {
		drawer, props, el,
		cleanup() { detach(); drawer.destroy(); dispose(); el.remove(); flushSync(); }
	};
}
