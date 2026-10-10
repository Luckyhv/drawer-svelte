/** Small DOM helpers. All of them are no-ops without a `document`. */
import type { Direction } from './math.js';

export const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

// ── Scroll lock ────────────────────────────────────────────────────────────
// `overflow: hidden` on <html> plus scrollbar-width compensation. Deliberately
// NOT `position: fixed` on <body>: that resets the scroll position and every
// "restore it afterwards" trick makes the page jump on close.
let lockCount = 0;
let saved: { overflow: string; paddingRight: string } | null = null;

export function lockScroll(): () => void {
	if (!isBrowser) return () => {};
	const root = document.documentElement;
	if (lockCount++ === 0) {
		const scrollbar = window.innerWidth - root.clientWidth;
		saved = { overflow: root.style.overflow, paddingRight: root.style.paddingRight };
		root.style.overflow = 'hidden';
		if (scrollbar > 0) root.style.paddingRight = `${(parseFloat(getComputedStyle(root).paddingRight) || 0) + scrollbar}px`;
	}
	let released = false;
	return () => {
		if (released) return;
		released = true;
		if (--lockCount === 0 && saved) {
			root.style.overflow = saved.overflow;
			root.style.paddingRight = saved.paddingRight;
			saved = null;
		}
	};
}

// ── Layer stack ────────────────────────────────────────────────────────────
// Open drawers in open order. Only the top one reacts to Escape and focus
// trapping, so a drawer opened from inside another (a GIF picker inside a
// comments sheet) behaves as you'd expect.
const layers: object[] = [];
export const layerStack = {
	push(layer: object) {
		if (!layers.includes(layer)) layers.push(layer);
	},
	remove(layer: object) {
		const i = layers.indexOf(layer);
		if (i !== -1) layers.splice(i, 1);
	},
	isTop(layer: object) {
		return layers[layers.length - 1] === layer;
	},
	depth(layer: object) {
		return layers.indexOf(layer);
	}
};

// ── Portal ─────────────────────────────────────────────────────────────────
export type PortalTarget = string | Element | null | undefined | false;

/** Attachment: moves the node into `target` (default `body`) once mounted. */
export function portal(target: PortalTarget) {
	return (node: HTMLElement) => {
		if (target === false) return;
		const el =
			typeof target === 'string'
				? document.querySelector(target)
				: (target ?? document.body);
		if (!el) return;
		el.appendChild(node);
		return () => node.remove();
	};
}

// ── Scroll containers ──────────────────────────────────────────────────────
/** Nearest ancestor of `from` (inside `root`) that scrolls along the drawer axis. */
export function scrollParent(from: Element | null, root: Element, direction: Direction): HTMLElement | null {
	const vertical = direction === 'bottom' || direction === 'top';
	let el: Element | null = from;
	while (el && el !== root.parentElement) {
		if (el instanceof HTMLElement) {
			const style = getComputedStyle(el);
			const overflow = vertical ? style.overflowY : style.overflowX;
			const scrollable = vertical ? el.scrollHeight > el.clientHeight + 1 : el.scrollWidth > el.clientWidth + 1;
			if (scrollable && (overflow === 'auto' || overflow === 'scroll')) return el;
		}
		if (el === root) break;
		el = el.parentElement;
	}
	return null;
}

/**
 * Is `el` scrolled to the edge a close-drag pulls away from? (For a bottom
 * drawer: scrolled to the top, so pulling down can't scroll any further.)
 */
export function atCloseEdge(el: HTMLElement, direction: Direction): boolean {
	switch (direction) {
		case 'bottom':
			return el.scrollTop <= 0;
		case 'top':
			return el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
		case 'right':
			return el.scrollLeft <= 0;
		case 'left':
			return el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
	}
}

/** Put `el` back at the edge `atCloseEdge` tests for. */
export function pinToCloseEdge(el: HTMLElement, direction: Direction): void {
	switch (direction) {
		case 'bottom':
			if (el.scrollTop !== 0) el.scrollTop = 0;
			break;
		case 'top':
			el.scrollTop = el.scrollHeight - el.clientHeight;
			break;
		case 'right':
			if (el.scrollLeft !== 0) el.scrollLeft = 0;
			break;
		case 'left':
			el.scrollLeft = el.scrollWidth - el.clientWidth;
			break;
	}
}

// ── Focus ──────────────────────────────────────────────────────────────────
const FOCUSABLE =
	'a[href],area[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),iframe,[contenteditable],[tabindex]:not([tabindex="-1"])';

export function focusables(root: HTMLElement): HTMLElement[] {
	return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
		(el) => !el.hasAttribute('inert') && el.getClientRects().length > 0
	);
}

export function isTextField(el: Element | null): boolean {
	if (!el) return false;
	if (el instanceof HTMLTextAreaElement) return true;
	if (el instanceof HTMLInputElement)
		return !['button', 'checkbox', 'radio', 'range', 'submit', 'reset', 'file', 'color', 'image'].includes(el.type);
	return (el as HTMLElement).isContentEditable === true;
}

/** Elements a drag must never start from (typing, selecting, sliders). */
export const NO_DRAG = 'input, textarea, select, [contenteditable="true"], [data-drawer-no-drag], [role="slider"]';
