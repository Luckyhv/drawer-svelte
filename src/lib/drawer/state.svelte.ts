import { getContext, setContext, untrack } from 'svelte';
import {
	atCloseEdge,
	pinToCloseEdge,
	focusables,
	isBrowser,
	isTextField,
	layerStack,
	lockScroll,
	NO_DRAG,
	scrollParent
} from './dom.js';
import {
	dampen,
	decideRelease,
	isVertical,
	resolveSnapSizes,
	springEasing,
	snapOffset,
	velocityOf,
	type Direction,
	type SnapPoint
} from './math.js';

export type DrawerProps = {
	open: boolean;
	direction: Direction;
	/** Overlay, scroll lock, focus trap, Escape/overlay-click to close. */
	modal: boolean;
	/** Can be closed by dragging, Escape or the overlay. */
	dismissible: boolean;
	snapPoints?: SnapPoint[];
	/** Snap index used each time the drawer opens (uncontrolled). */
	defaultSnap: number;
	/** Controlled snap index (bind:activeSnap). */
	activeSnap?: number;
	/** Fraction of the size to drag past before a slow release closes. */
	closeThreshold: number;
	/** px/ms that counts as a flick. */
	velocityThreshold: number;
	/** Only `Drawer.Handle` starts drags. */
	handleOnly: boolean;
	/** Lock page scroll while open. Defaults to `modal`. */
	lockScroll?: boolean;
	/** Return focus to the previously focused element on close (no scroll). */
	restoreFocus: boolean;
	/** Lift bottom drawers above the on-screen keyboard while a field is focused. */
	keyboardAware: boolean;
	/** ms; 0 disables animation. */
	duration: number;
	/** CSS timing function for the slide / fade. */
	easing: string;
	/** Shrink `[data-drawer-wrapper]` behind a modal bottom drawer (iOS sheet look). */
	scaleBackground: boolean;
	/** Recede slightly while another drawer is open on top of this one. */
	scaleNested: boolean;
	/** Every flick moves exactly one snap, instead of travelling further the harder it is. */
	snapToSequentialPoint: boolean;
	/** ms after the content last scrolled during which a touch scrolls instead of dragging. */
	scrollLockTimeout: number;
	/**
	 * How snap points size the drawer. `translate` (default): the element is as
	 * tall as the largest snap and slides, fastest. `height`: the element is as
	 * tall as the active snap, so its bottom (a footer, buttons) is always on
	 * screen; expanding drags grow the height.
	 */
	snapSizing: 'translate' | 'height';
	/** Colour scheme for the optional stylesheet: follows the OS / a `.dark` ancestor on `auto`. */
	theme: DrawerTheme;
	/** Per-drawer colour overrides, emitted as `--drawer-*` custom properties. */
	colors?: DrawerColors;
};

export type DrawerTheme = 'light' | 'dark' | 'auto';
export type DrawerColors = Partial<
	Record<'bg' | 'fg' | 'muted' | 'border' | 'handle' | 'overlay' | 'shadow' | 'accent', string>
>;

export type DrawerCallbacks = {
	setOpen: (open: boolean) => void;
	setActiveSnap: (index: number) => void;
	onOpenChange?: (open: boolean) => void;
	onAnimationEnd?: (open: boolean) => void;
	onSnapChange?: (index: number) => void;
};

type Phase = 'closed' | 'opening' | 'open' | 'closing';
type Gesture = {
	pointer: 'touch' | 'mouse';
	/** Touch identifier: extra fingers are ignored until this one lifts. */
	id: number;
	/** The content was still scrolling (momentum) when the finger landed. */
	afterScroll: boolean;
	start: number;
	cross: number;
	target: Element;
	scroller: HTMLElement | null;
	fromHandle: boolean;
	/** `scroll`: the browser is scrolling the list; the drawer waits for it to reach its edge. */
	mode: 'pending' | 'drag' | 'scroll' | 'ignore';
	/** Finger position when a browser-scrolled list was first seen at its edge. */
	edge: number | null;
	/** The drag took over from a browser scroll, so its moves cannot be cancelled. */
	handoff: boolean;
	samples: { v: number; t: number }[];
	moved: boolean;
	size: number;
	/** Offset the drag started from: the resting spot, or wherever a running animation was caught. */
	base: number;
};

export const DEFAULT_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';
/** ms of momentum a flick carries toward the snap it lands on. */
const FLICK_MOMENTUM = 100;
let uid = 0;
/** Drawers that are open (not closing), in open order. Reactive, so a covered drawer can recede. */
const openStack = $state<DrawerState[]>([]);

export class DrawerState {
	readonly id: string;
	get titleId() {
		return `${this.id}-title`;
	}
	get descriptionId() {
		return `${this.id}-description`;
	}

	#props: () => DrawerProps;
	#cb: DrawerCallbacks;

	phase = $state<Phase>('closed');
	mounted = $state(false);
	contentEl = $state<HTMLElement | null>(null);
	/** Current drag, px toward closed (negative = rubber-banding past open). */
	drag = $state(0);
	dragging = $state(false);
	viewport = $state({ w: isBrowser ? window.innerWidth : 0, h: isBrowser ? window.innerHeight : 0 });
	keyboardInset = $state(0);
	/** Space between the drawer's natural edge and the viewport edge (margins). */
	gap = $state(0);
	#internalSnap = $state(0);
	#gesture: Gesture | null = null;
	#returnFocus: HTMLElement | null = null;
	#unlock: (() => void) | null = null;
	#closeTimer: ReturnType<typeof setTimeout> | null = null;
	#lastScroll = 0;
	#paintFrame: number | null = null;
	#pointerCleanup: (() => void) | null = null;
	#savedUserSelect: string | null = null;
	#closeCleanup: (() => void) | null = null;
	#backgroundEl: HTMLElement | null = null;
	#backgroundStyles: Partial<CSSStyleDeclaration> | null = null;
	/** The page background from before it went dark behind the scaled card. */
	#backdrop: string | null = null;
	#resolvedSnaps = $derived.by(() => {
		const points = this.#props().snapPoints;
		return points?.length ? resolveSnapSizes(points, this.axisViewport) : [];
	});
	/** Set by Drawer.Overlay, so a drag can fade it without a re-render. */
	overlayEl = $state<HTMLElement | null>(null);
	/** Drag offset during a gesture. Painted straight to the DOM; `drag` catches up on release. */
	#liveDrag = 0;
	/** Length of the animation a release started. */
	#releaseMs = $state<number | null>(null);
	/** Easing of that animation: a curve that starts at the finger's speed. */
	#releaseEase = $state<string | null>(null);
	/**
	 * `--drawer-hidden` as written to the element. It trails the active snap
	 * until the snap animation is over: changing a custom property restyles
	 * every child, and that must not land on the animation's first frame.
	 */
	#hidden = $state(0);
	#releaseTimer: ReturnType<typeof setTimeout> | null = null;
	#openFrame: number | null = null;
	#openTimer: ReturnType<typeof setTimeout> | null = null;

	constructor(props: () => DrawerProps, cb: DrawerCallbacks, id = `drawer-${++uid}`) {
		this.id = id;
		this.#props = props;
		this.#cb = cb;
		this.#internalSnap = props().defaultSnap;

		// Follow the `open` prop.
		$effect(() => {
			const open = this.#props().open;
			untrack(() => (open ? this.#show() : this.#hide()));
		});

		// Viewport size (snap points are live, not cached at mount).
		$effect(() => {
			if (!this.mounted) return;
			const onResize = () => {
				// The keyboard resizes the viewport on some browsers; ignore that.
				if (isTextField(document.activeElement)) return;
				this.viewport = { w: window.innerWidth, h: window.innerHeight };
			};
			onResize();
			window.addEventListener('resize', onResize);
			return () => window.removeEventListener('resize', onResize);
		});

		// On-screen keyboard (bottom drawers).
		$effect(() => {
			const vv = isBrowser ? window.visualViewport : null;
			if (!this.mounted || !vv || !this.#props().keyboardAware || this.direction !== 'bottom') return;
			const update = () => {
				const el = this.contentEl;
				const focused = document.activeElement;
				const inside = !!el && !!focused && el.contains(focused) && isTextField(focused);
				const inset = vv.scale === 1 ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop) : 0;
				this.keyboardInset = inside && inset > 40 ? Math.round(inset) : 0;
			};
			untrack(update);
			const onFocusOut = () => queueMicrotask(update);
			vv.addEventListener('resize', update);
			vv.addEventListener('scroll', update);
			document.addEventListener('focusin', update);
			document.addEventListener('focusout', onFocusOut);
			return () => {
				vv.removeEventListener('resize', update);
				vv.removeEventListener('scroll', update);
				document.removeEventListener('focusin', update);
				document.removeEventListener('focusout', onFocusOut);
				this.keyboardInset = 0;
			};
		});

		// Escape + focus trap (top-most drawer only).
		$effect(() => {
			if (!this.mounted) return;
			const onKey = (e: KeyboardEvent) => {
				if (!layerStack.isTop(this) || e.defaultPrevented) return;
				if (e.key === 'Escape' && this.#props().dismissible) {
					e.preventDefault();
					this.close();
				} else if (e.key === 'Tab' && this.modal) this.#trapTab(e);
			};
			document.addEventListener('keydown', onKey);
			return () => document.removeEventListener('keydown', onKey);
		});

		// iOS-style background scale behind a modal bottom drawer.
		$effect(() => {
			if (!this.mounted) return;
			this.#paintBackground(this.phase === 'open' ? this.overlayOpacity : 0, this.dragging);
		});

		// Report the completed open animation, including zero-duration opens.
		$effect(() => {
			const el = this.contentEl;
			if (!el || this.phase !== 'open') return;
			const duration = this.#props().duration;
			let finished = false;
			const done = () => {
				if (finished) return;
				finished = true;
				untrack(() => this.#cb.onAnimationEnd?.(true));
			};
			const onEnd = (e: TransitionEvent) => {
				if (e.target === el && e.propertyName === 'transform') done();
			};
			el.addEventListener('transitionend', onEnd);
			const timer = setTimeout(done, duration === 0 ? 0 : duration + 80);
			return () => {
				clearTimeout(timer);
				el.removeEventListener('transitionend', onEnd);
			};
		});

		// `--drawer-hidden` follows the active snap, but only once the sheet has
		// stopped moving (straight away while it is not on screen yet).
		$effect(() => {
			const resting = this.resting;
			if (!this.mounted) return;
			if (untrack(() => this.phase) !== 'open') {
				this.#hidden = resting;
				return;
			}
			const timer = setTimeout(() => (this.#hidden = resting), this.#props().duration + 60);
			return () => clearTimeout(timer);
		});

		// Once the content exists, measure its margins and focus it.
		$effect(() => {
			const el = this.contentEl;
			if (!el) return;
			untrack(() => {
				this.#measureGap(el);
				if (this.phase === 'opening') {
					el.focus({ preventScroll: true });
					// The closed position must be computed before switching to open,
					// or there is nothing to transition from.
					void getComputedStyle(el).transform;
					this.#startOpen();
				}
			});
		});
	}

	/**
	 * Start the slide one frame after mounting. That first frame lays out and
	 * paints the content while it is still parked off screen, so the cost of a
	 * heavy sheet never lands inside the animation and makes it skip.
	 */
	#startOpen() {
		const go = () => {
			this.#clearOpen();
			if (this.phase === 'opening') this.phase = 'open';
		};
		if (this.#props().duration === 0) return go();
		// Hidden tabs get no frames: the timer opens the drawer there.
		this.#openTimer = setTimeout(go, 120);
		this.#openFrame = requestAnimationFrame(() => {
			this.#openFrame = requestAnimationFrame(go);
		});
	}

	#clearOpen() {
		if (this.#openFrame !== null) cancelAnimationFrame(this.#openFrame);
		if (this.#openTimer !== null) clearTimeout(this.#openTimer);
		this.#openFrame = null;
		this.#openTimer = null;
	}

	/** Current offset along the axis, read from the screen (so mid-animation too). */
	#offsetNow(): number | null {
		const el = this.contentEl;
		if (!el || (this.#props().snapSizing === 'height' && this.hasSnaps)) return null;
		const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
		const along = { bottom: m.m42, top: -m.m42, right: m.m41, left: -m.m41 }[this.direction];
		return along + this.keyboardInset;
	}

	#setRelease(ms: number | null, ease: string | null = null) {
		if (this.#releaseTimer !== null) clearTimeout(this.#releaseTimer);
		this.#releaseTimer = null;
		this.#releaseMs = ms;
		this.#releaseEase = ms === null ? null : ease;
		// Later moves (a programmatic snap, the keyboard) go back to the normal pace.
		if (ms !== null) {
			this.#releaseTimer = setTimeout(() => {
				this.#releaseMs = null;
				this.#releaseEase = null;
			}, ms + 60);
		}
	}

	// ── Derived props ───────────────────────────────────────────────────────
	get direction() {
		return this.#props().direction;
	}
	get modal() {
		return this.#props().modal;
	}
	get vertical() {
		return isVertical(this.direction);
	}
	get axisViewport() {
		return this.vertical ? this.viewport.h : this.viewport.w;
	}
	get snapSizes(): number[] {
		return this.#resolvedSnaps;
	}
	get hasSnaps() {
		return this.snapSizes.length > 0;
	}
	get activeSnap(): number {
		const controlled = this.#props().activeSnap;
		const i = controlled ?? this.#internalSnap;
		return Math.max(0, Math.min(i, this.snapSizes.length - 1));
	}
	/** Largest snap size (the element's size along the axis), or null = content size. */
	get maxSize(): number | null {
		const s = this.snapSizes;
		return s.length ? s[s.length - 1] : null;
	}
	/** Resting offset at the active snap. */
	get resting(): number {
		const max = this.maxSize;
		return max === null ? 0 : snapOffset(this.snapSizes, this.activeSnap, max);
	}

	/** How many open drawers sit on top of this one. */
	get covered(): number {
		const i = openStack.indexOf(this);
		return i === -1 ? 0 : openStack.length - 1 - i;
	}

	// ── Styles ──────────────────────────────────────────────────────────────
	/** Recede toward the drawer's own edge while another drawer covers it. */
	get #nestScale(): string {
		const n = this.#props().scaleNested && this.phase === 'open' ? this.covered : 0;
		return n ? ` scale(${Math.max(0.85, 1 - 0.05 * n)})` : '';
	}
	get #origin(): string {
		const edge = { bottom: 'center bottom', top: 'center top', left: 'left center', right: 'right center' };
		return `transform-origin: ${edge[this.direction]}`;
	}
	#translate(value: string): string {
		switch (this.direction) {
			case 'bottom':
				return `translate3d(0, ${value}, 0)`;
			case 'top':
				return `translate3d(0, calc(-1 * (${value})), 0)`;
			case 'right':
				return `translate3d(${value}, 0, 0)`;
			case 'left':
				return `translate3d(calc(-1 * (${value})), 0, 0)`;
		}
	}

	#paintBackground(progress: number, dragging: boolean) {
		const p = this.#props();
		if (!p.scaleBackground || !p.modal || this.direction !== 'bottom') return;
		const wrapper = this.#backgroundEl ?? document.querySelector<HTMLElement>('[data-drawer-wrapper]');
		if (!wrapper) return;
		if (!this.#backgroundEl) {
			this.#backgroundEl = wrapper;
			const style = wrapper.style;
			this.#backgroundStyles = {
				transformOrigin: style.transformOrigin, transform: style.transform,
				clipPath: style.clipPath, transition: style.transition, willChange: style.willChange
			};
			// Everything but the transform is set once, before the slide starts, so
			// each frame after that is a compositor-only move. The card is the part
			// of the page on screen: it scales from the top of the viewport and its
			// rounded corners are cut there, wherever the page is scrolled to.
			const rect = wrapper.getBoundingClientRect();
			const top = Math.max(0, -rect.top);
			const left = Math.max(0, -rect.left);
			const right = Math.max(0, rect.right - window.innerWidth);
			const bottom = Math.max(0, rect.bottom - window.innerHeight);
			style.transformOrigin = `${left + window.innerWidth / 2}px ${top}px`;
			style.clipPath = `inset(${top}px ${right}px ${bottom}px ${left}px round 12px)`;
			style.willChange = 'transform';
			// A dark page behind the card is what makes its edges read. Only when
			// the wrapper paints its own background, or the page itself would go dark.
			const paints = !/^(transparent|rgba\(0, 0, 0, 0\))$/.test(getComputedStyle(wrapper).backgroundColor);
			if (paints) {
				this.#backdrop = document.documentElement.style.backgroundColor;
				document.documentElement.style.backgroundColor = '#000';
			}
		}
		const scale = 1 - (32 / Math.max(window.innerWidth, 1)) * progress;
		// Same pace as the sheet, including a release that was matched to the finger.
		const ms = this.#releaseMs ?? (this.phase === 'closing' ? Math.round(p.duration * 0.7) : p.duration);
		wrapper.style.transition = dragging ? 'none' : `transform ${ms}ms ${this.#releaseEase ?? p.easing}`;
		wrapper.style.transform = `scale(${scale}) translate3d(0, ${14 * progress}px, 0)`;
	}

	#restoreBackground() {
		if (this.#backgroundEl && this.#backgroundStyles) {
			Object.assign(this.#backgroundEl.style, this.#backgroundStyles);
		}
		if (this.#backdrop !== null) document.documentElement.style.backgroundColor = this.#backdrop;
		this.#backdrop = null;
		this.#backgroundEl = null;
		this.#backgroundStyles = null;
	}

	/** Where an open drawer sits for a drag offset (and its size, when snaps size it). */
	#frame(drag: number): { transform: string; size: number | null } {
		if (this.#props().snapSizing === 'height' && this.hasSnaps) {
			// Size = active snap; expanding grows the size, closing slides.
			const offset = this.resting + drag; // same units as translate mode
			const size = offset < this.resting ? this.maxSize! - offset : this.snapSizes[this.activeSnap];
			const slide = Math.max(0, offset - this.resting) - this.keyboardInset;
			return { transform: `${this.#translate(`${slide}px`)}${this.#nestScale}`, size: Math.round(size) };
		}
		const offset = this.resting + drag - this.keyboardInset;
		return { transform: `${this.#translate(`${offset}px`)}${this.#nestScale}`, size: this.maxSize };
	}

	/**
	 * Follow the finger by writing to the elements directly. Going through
	 * state would rewrite the whole style attribute (custom properties
	 * included) on every touch event, which restyles every child.
	 */
	#paint(drag: number) {
		const el = this.contentEl;
		if (!el) return;
		const frame = this.#frame(drag);
		el.style.transform = frame.transform;
		if (frame.size !== null && this.#props().snapSizing === 'height') {
			el.style[this.vertical ? 'height' : 'width'] = `${frame.size}px`;
		}
		const opacity = this.#opacityAt(drag);
		if (this.overlayEl) this.overlayEl.style.opacity = String(opacity);
		this.#paintBackground(opacity, true);
	}

	get contentStyle(): string {
		const p = this.#props();
		const shown = this.phase === 'open';
		const duration = this.#releaseMs ?? (this.phase === 'closing' ? Math.round(p.duration * 0.7) : p.duration);
		const ease = this.#releaseEase ?? p.easing;
		const axis = this.vertical ? 'height' : 'width';
		// No transition while dragging (follow the finger) or while parked closed
		// before the open animation starts.
		const idle = this.dragging || this.phase === 'opening';

		const heightMode = p.snapSizing === 'height' && this.hasSnaps;
		const frame = shown
			? this.#frame(this.drag)
			: {
					transform: this.#translate(`calc(100% + ${this.gap + 8}px)`),
					size: heightMode ? this.snapSizes[this.activeSnap] : this.maxSize
				};
		return [
			`transform: ${frame.transform}`,
			this.#origin,
			`transition: ${idle ? 'none' : `transform ${duration}ms ${ease}${heightMode ? `, ${axis} ${duration}ms ${ease}` : ''}`}`,
			`--drawer-hidden: ${heightMode ? 0 : this.#hidden}px`,
			frame.size === null ? '' : `${axis}: ${Math.round(frame.size)}px`,
			'will-change: transform',
			'outline: none',
			'overscroll-behavior: contain',
			// Keep native list scrolling and pinch zoom. Single-finger moves are
			// prevented while a drag is being decided outside a list, and once a
			// drag wins; handles opt out of browser gestures themselves.
			'touch-action: auto'
		]
			.filter(Boolean)
			.join('; ');
	}

	get overlayOpacity(): number {
		if (this.phase !== 'open') return 0;
		return this.dragging ? this.#opacityAt(this.drag) : 1;
	}

	/** Fade only once the drawer is below its smallest snap. */
	#opacityAt(drag: number): number {
		if (drag <= 0) return 1;
		const ref = this.hasSnaps ? this.snapSizes[0] : this.#gesture?.size || (this.vertical ? this.contentEl?.offsetHeight : this.contentEl?.offsetWidth) || 1;
		const past = this.resting + drag - (this.hasSnaps ? snapOffset(this.snapSizes, 0, this.maxSize!) : 0);
		return Math.max(0, Math.min(1, 1 - past / ref));
	}

	get overlayStyle(): string {
		const p = this.#props();
		return `opacity: ${this.overlayOpacity}; transition: ${this.dragging ? 'none' : `opacity ${this.#releaseMs ?? p.duration}ms ${this.#releaseEase ?? p.easing}`}; will-change: opacity; touch-action: none;`;
	}

	get theme(): DrawerTheme {
		return this.#props().theme;
	}

	/** `--drawer-*` overrides from the `colors` prop (empty when unset). */
	get colorVars(): string {
		const c = this.#props().colors;
		if (!c) return '';
		return Object.entries(c)
			.filter(([, v]) => v)
			.map(([k, v]) => `--drawer-${k}: ${v}`)
			.join('; ');
	}

	get state(): 'open' | 'closed' {
		return this.phase === 'open' || this.phase === 'opening' ? 'open' : 'closed';
	}

	// ── Open / close ────────────────────────────────────────────────────────
	open() {
		if (!this.#props().open) this.#setOpen(true);
	}
	close() {
		if (this.#props().open) this.#setOpen(false);
	}
	toggle() {
		this.#setOpen(!this.#props().open);
	}
	snapTo(index: number) {
		const i = Math.max(0, Math.min(index, this.snapSizes.length - 1));
		this.#internalSnap = i;
		this.#cb.setActiveSnap(i);
		this.#cb.onSnapChange?.(i);
	}

	#setOpen(open: boolean) {
		this.#cb.setOpen(open);
		this.#cb.onOpenChange?.(open);
	}

	#show() {
		if (!isBrowser) return;
		this.#clearClose();
		if (this.phase === 'open' || this.phase === 'opening') return;
		const p = this.#props();
		if (p.activeSnap === undefined) this.#internalSnap = p.defaultSnap;
		this.#setRelease(null);
		this.drag = 0;
		if (!this.mounted) {
			this.#returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		}
		layerStack.push(this);
		if (!openStack.includes(this)) openStack.push(this);
		if ((p.lockScroll ?? p.modal) && !this.#unlock) this.#unlock = lockScroll();
		if (this.mounted && this.contentEl) {
			// Re-opened mid-close: just turn around.
			this.phase = 'open';
			return;
		}
		this.phase = 'opening';
		this.mounted = true;
	}

	#hide() {
		if (this.phase === 'closed' || this.phase === 'closing') return;
		this.#cancelGesture();
		this.#clearOpen();
		this.phase = 'closing';
		this.#leaveOpenStack();
		this.keyboardInset = 0;
		const duration = this.#props().duration;
		// Unmount when the slide-out ends (timer fallback: transitionend can be skipped).
		const done = () => {
			if (this.phase !== 'closing') return;
			this.#clearClose();
			this.#finishClose();
		};
		const onEnd = (e: TransitionEvent) => {
			if (e.target === this.contentEl && e.propertyName === 'transform') done();
		};
		const el = this.contentEl;
		el?.addEventListener('transitionend', onEnd);
		this.#closeCleanup = () => el?.removeEventListener('transitionend', onEnd);
		this.#closeTimer = setTimeout(done, duration === 0 ? 0 : Math.round(duration * 0.7) + 80);
	}

	#finishClose() {
		this.#closeTimer = null;
		this.phase = 'closed';
		this.#restoreBackground();
		this.mounted = false;
		this.drag = 0;
		const wasTop = layerStack.isTop(this);
		layerStack.remove(this);
		this.#unlock?.();
		this.#unlock = null;
		const back = this.#returnFocus;
		this.#returnFocus = null;
		if (wasTop && this.#props().restoreFocus && back?.isConnected) back.focus({ preventScroll: true });
		this.#cb.onAnimationEnd?.(false);
	}

	#leaveOpenStack() {
		const i = openStack.indexOf(this);
		if (i !== -1) openStack.splice(i, 1);
	}

	#clearClose() {
		if (this.#closeTimer !== null) clearTimeout(this.#closeTimer);
		this.#closeTimer = null;
		this.#closeCleanup?.();
		this.#closeCleanup = null;
	}

	#cancelGesture() {
		if (this.#paintFrame !== null) cancelAnimationFrame(this.#paintFrame);
		this.#paintFrame = null;
		this.#pointerCleanup?.();
		this.#pointerCleanup = null;
		if (this.#savedUserSelect !== null) {
			document.documentElement.style.userSelect = this.#savedUserSelect;
			this.#savedUserSelect = null;
		}
		this.#gesture = null;
		this.dragging = false;
	}

	destroy() {
		this.#clearClose();
		this.#clearOpen();
		if (this.#releaseTimer !== null) clearTimeout(this.#releaseTimer);
		this.#cancelGesture();
		this.#restoreBackground();
		this.#leaveOpenStack();
		layerStack.remove(this);
		this.#unlock?.();
	}

	#measureGap(el: HTMLElement) {
		const rect = el.getBoundingClientRect();
		const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
		const vw = window.innerWidth;
		const vh = window.innerHeight;
		let gap = 0;
		switch (this.direction) {
			case 'bottom':
				gap = vh - (rect.bottom - m.m42);
				break;
			case 'top':
				gap = rect.top - m.m42;
				break;
			case 'right':
				gap = vw - (rect.right - m.m41);
				break;
			case 'left':
				gap = rect.left - m.m41;
				break;
		}
		this.gap = Math.max(0, Math.round(gap));
	}

	#trapTab(e: KeyboardEvent) {
		const el = this.contentEl;
		if (!el) return;
		const items = focusables(el);
		if (!items.length) {
			e.preventDefault();
			el.focus({ preventScroll: true });
			return;
		}
		const first = items[0];
		const last = items[items.length - 1];
		const active = document.activeElement;
		if (e.shiftKey && (active === first || active === el)) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && (active === last || !el.contains(active))) {
			e.preventDefault();
			first.focus();
		}
	}

	onOverlayPointerDown = (e: PointerEvent) => {
		if (e.button !== 0 || !layerStack.isTop(this) || !this.#props().dismissible) return;
		e.preventDefault();
		this.close();
	};

	// ── Gestures ────────────────────────────────────────────────────────────
	/** Main-axis coordinate, oriented so "toward closed" is positive. */
	#main(x: number, y: number) {
		switch (this.direction) {
			case 'bottom':
				return y;
			case 'top':
				return -y;
			case 'right':
				return x;
			case 'left':
				return -x;
		}
	}
	#crossOf(x: number, y: number) {
		return this.vertical ? x : y;
	}

	#canStart(target: Element): boolean {
		if (this.phase !== 'open' || !this.contentEl || !layerStack.isTop(this)) return false;
		// Ignore events from another drawer's content portaled inside ours.
		const owner = target.closest('[data-drawer-content]');
		if (owner && owner !== this.contentEl) return false;
		const handle = target.closest('[data-drawer-handle]');
		if (this.#props().handleOnly) return !!handle;
		if (!handle && target.closest(NO_DRAG)) return false;
		return true;
	}

	#begin(pointer: 'touch' | 'mouse', x: number, y: number, target: Element, id = -1) {
		const el = this.contentEl!;
		this.#gesture = {
			pointer,
			id,
			afterScroll: performance.now() - this.#lastScroll < this.#props().scrollLockTimeout,
			start: this.#main(x, y),
			cross: this.#crossOf(x, y),
			target,
			scroller: scrollParent(target, el, this.direction),
			fromHandle: !!target.closest('[data-drawer-handle]'),
			mode: 'pending',
			edge: null,
			handoff: false,
			samples: [],
			moved: false,
			size: this.vertical ? el.offsetHeight : el.offsetWidth,
			base: this.resting
		};
		// A list that rubber-bands at its edge moves instead of the drawer, and
		// keeps bouncing after the finger is gone. Inside a drawer the pull
		// belongs to the sheet.
		const scroller = this.#gesture.scroller;
		if (scroller && pointer === 'touch') {
			scroller.style[this.vertical ? 'overscrollBehaviorY' : 'overscrollBehaviorX'] = 'none';
		}
	}

	#startDrag(g: Gesture, at: number, base: number) {
		g.mode = 'drag';
		g.start = at; // no jump: measure from here
		g.base = base;
		g.samples = [];
		this.#setRelease(null);
		this.#liveDrag = g.base - this.resting;
		this.dragging = true;
		// The re-render that drops the transition lands after this event:
		// drop it now so the very first frame already tracks the finger.
		this.contentEl!.style.transition = 'none';
		if (this.overlayEl) this.overlayEl.style.transition = 'none';
	}

	/** Returns true when the event should be prevented (we're dragging). */
	#move(x: number, y: number, cancelable: boolean, time: number): boolean {
		const g = this.#gesture;
		if (!g || g.mode === 'ignore') return false;
		const main = this.#main(x, y) - g.start;
		const cross = this.#crossOf(x, y) - g.cross;

		if (g.mode === 'scroll') {
			// The browser owns this touch and is scrolling the list. Once the list
			// is at its edge and the finger keeps pulling, the sheet takes over in
			// the same gesture, the way a native sheet does.
			const at = this.#main(x, y);
			if (!g.scroller || !atCloseEdge(g.scroller, this.direction)) {
				g.edge = null;
				return false;
			}
			if (g.edge === null || at < g.edge) g.edge = at;
			if (at - g.edge < 3) return false;
			g.handoff = true;
			this.#startDrag(g, at, this.resting);
		}

		if (g.mode === 'pending') {
			// Over a list, decide on the first real movement: a touch browser that
			// is not stopped on its first move scrolls and keeps the gesture.
			const slop = g.pointer === 'mouse' ? 5 : g.scroller ? 1 : 3;
			// Outside a list nothing should scroll, so hold the gesture while it is
			// still too small to read; otherwise the browser claims it for good.
			if (Math.abs(main) < slop && Math.abs(cross) < slop) return g.pointer === 'touch' && !g.scroller && cancelable;
			// A list the browser scrolls is watched for the hand-off above.
			const yields = (): false => {
				g.mode = g.scroller && g.pointer === 'touch' && Math.abs(main) >= Math.abs(cross) ? 'scroll' : 'ignore';
				return false;
			};
			if (Math.abs(cross) > Math.abs(main) || !cancelable) return yields();
			const scrollerAtEdge = !g.scroller || atCloseEdge(g.scroller, this.direction);
			let drag: boolean;
			if (main > 0) {
				// A list flung to its top is still settling: that touch must not
				// turn into a fast drag that closes the drawer by accident.
				drag = g.fromHandle || (scrollerAtEdge && !(g.scroller && g.afterScroll));
			} else if (this.hasSnaps && this.activeSnap < this.snapSizes.length - 1) {
				drag = g.fromHandle || scrollerAtEdge;
			} else {
				// Fully open: content scrolls; non-scrolling areas rubber-band.
				drag = g.fromHandle || !g.scroller;
			}
			if (!drag) return yields();
			// Caught mid-animation (still opening, or settling on a snap): carry on
			// from where the sheet is on screen, not from where it was heading.
			this.#startDrag(g, this.#main(x, y), this.#offsetNow() ?? this.resting);
			if (g.pointer === 'mouse') {
				this.#savedUserSelect = document.documentElement.style.userSelect;
				document.documentElement.style.userSelect = 'none';
			}
		}

		const raw = this.#main(x, y) - g.start;
		if (g.handoff && g.scroller) {
			if (raw < 0) {
				// Pushed back to where the pull began: the sheet rests and the list
				// scrolls again.
				this.#liveDrag = 0;
				this.#paint(0);
				g.mode = 'scroll';
				g.edge = null;
				return false;
			}
			// These moves cannot be cancelled, so the browser may still try to
			// scroll the list under the finger: keep it at its edge.
			pinToCloseEdge(g.scroller, this.direction);
		}
		let offset = g.base + raw;
		if (offset < 0) offset = -dampen(-offset);
		if (!this.#props().dismissible) {
			const floor = this.hasSnaps ? snapOffset(this.snapSizes, 0, this.maxSize!) : 0;
			if (offset > floor) offset = floor + dampen(offset - floor);
		}
		this.#liveDrag = offset - this.resting;
		if (this.#paintFrame === null) {
			this.#paintFrame = requestAnimationFrame(() => {
				this.#paintFrame = null;
				this.#paint(this.#liveDrag);
			});
		}
		if (Math.abs(raw) > 3) g.moved = true;
		g.samples.push({ v: offset, t: time });
		if (g.samples.length > 20) g.samples.shift();
		return cancelable;
	}

	#end(cancelled = false, time = performance.now()) {
		const g = this.#gesture;
		// Flush the last position before enabling the release transition.
		if (g?.mode === 'drag') this.#paint(this.#liveDrag);
		this.#cancelGesture();
		if (!g || g.mode !== 'drag') return;
		if (cancelled) {
			this.drag = 0;
			return;
		}
		if (g.moved) suppressNextClick();
		const p = this.#props();
		const offset = this.resting + this.#liveDrag;
		const size = this.maxSize ?? (this.vertical ? this.contentEl?.offsetHeight : this.contentEl?.offsetWidth) ?? 0;
		// A finger that stopped before lifting is not a flick, however fast it moved earlier.
		const velocity = time - (g.samples.at(-1)?.t ?? 0) > 80 ? 0 : velocityOf(g.samples);
		const result = decideRelease({
			offset,
			velocity,
			size,
			snapSizes: this.snapSizes,
			activeIndex: this.activeSnap,
			dismissible: p.dismissible,
			closeThreshold: p.closeThreshold,
			velocityThreshold: p.velocityThreshold,
			momentum: p.snapToSequentialPoint ? 0 : FLICK_MOMENTUM
		});
		// Leave at the finger's speed: the curve carries it into the animation
		// and eases to rest.
		const target = result.action === 'close' ? size + this.gap : snapOffset(this.snapSizes, result.index, size);
		const distance = Math.abs(target - offset);
		const toward = (Math.sign(target - offset) || 1) * velocity;
		const base = result.action === 'close' ? Math.round(p.duration * 0.7) : p.duration;
		this.#setRelease(base, p.easing === DEFAULT_EASE && base > 0 ? springEasing(distance, toward, base) : null);
		this.dragging = false;
		if (result.action === 'close') {
			// Keep the dragged offset: the close transition starts from here.
			this.drag = this.#liveDrag;
			this.close();
			return;
		}
		if (this.hasSnaps && result.index !== this.activeSnap) this.snapTo(result.index);
		this.drag = 0;
	}

	/** Attachment for Drawer.Content: wires touch + mouse gestures. */
	gestures = (node: HTMLElement) => {
		const tracked = (list: TouchList) => {
			const id = this.#gesture?.id;
			for (const t of list) if (t.identifier === id) return t;
			return null;
		};
		const onTouchStart = (e: TouchEvent) => {
			// A second finger never takes over or ends the drag: the first one owns it.
			if (this.#gesture?.pointer === 'touch') return;
			const t = e.changedTouches[0];
			if (!t || !this.#canStart(e.target as Element)) return;
			this.#begin('touch', t.clientX, t.clientY, e.target as Element, t.identifier);
		};
		const onTouchMove = (e: TouchEvent) => {
			if (this.#gesture?.pointer !== 'touch') return;
			const t = tracked(e.touches);
			// Two fingers are a pinch: never hold that back, or start a drag from it.
			if (!t || (e.touches.length > 1 && this.#gesture.mode !== 'drag')) return;
			if (this.#move(t.clientX, t.clientY, e.cancelable, e.timeStamp)) e.preventDefault();
		};
		const onTouchEnd = (e: TouchEvent) => {
			if (this.#gesture?.pointer === 'touch' && !tracked(e.touches)) this.#end(false, e.timeStamp);
		};
		const onTouchCancel = (e: TouchEvent) => {
			if (this.#gesture?.pointer === 'touch' && tracked(e.changedTouches)) this.#end(true);
		};
		const onScroll = () => (this.#lastScroll = performance.now());
		const onPointerDown = (e: PointerEvent) => {
			if (e.pointerType === 'touch' || e.button !== 0 || !e.isPrimary || this.#gesture) return;
			if (!this.#canStart(e.target as Element)) return;
			this.#begin('mouse', e.clientX, e.clientY, e.target as Element);
			const move = (ev: PointerEvent) => {
				if (ev.pointerId !== e.pointerId) return;
				if (this.#move(ev.clientX, ev.clientY, true, ev.timeStamp)) ev.preventDefault();
			};
			const up = (ev: PointerEvent) => {
				if (ev.pointerId === e.pointerId) this.#end(ev.type === 'pointercancel', ev.timeStamp);
			};
			const blur = () => this.#end(true);
			this.#pointerCleanup = () => {
				window.removeEventListener('pointermove', move);
				window.removeEventListener('pointerup', up);
				window.removeEventListener('pointercancel', up);
				window.removeEventListener('blur', blur);
			};
			window.addEventListener('blur', blur);
			window.addEventListener('pointermove', move);
			window.addEventListener('pointerup', up);
			window.addEventListener('pointercancel', up);
		};
		node.addEventListener('touchstart', onTouchStart, { passive: true });
		node.addEventListener('touchmove', onTouchMove, { passive: false });
		node.addEventListener('touchend', onTouchEnd);
		node.addEventListener('touchcancel', onTouchCancel);
		node.addEventListener('pointerdown', onPointerDown);
		// Scroll events do not bubble: capture them from any list inside.
		node.addEventListener('scroll', onScroll, { capture: true, passive: true });
		return () => {
			this.#cancelGesture();
			node.removeEventListener('scroll', onScroll, { capture: true });
			node.removeEventListener('touchstart', onTouchStart);
			node.removeEventListener('touchmove', onTouchMove);
			node.removeEventListener('touchend', onTouchEnd);
			node.removeEventListener('touchcancel', onTouchCancel);
			node.removeEventListener('pointerdown', onPointerDown);
		};
	};
}

/** A drag that ends over a button must not also click it. */
function suppressNextClick() {
	const stop = (e: Event) => {
		e.stopPropagation();
		e.preventDefault();
	};
	window.addEventListener('click', stop, { capture: true, once: true });
	setTimeout(() => window.removeEventListener('click', stop, { capture: true }), 50);
}

const KEY = Symbol('drawer');
export function setDrawerContext(state: DrawerState) {
	return setContext(KEY, state);
}
export function getDrawerContext(): DrawerState {
	const ctx = getContext<DrawerState | undefined>(KEY);
	if (!ctx) throw new Error('Drawer parts must be used inside <Drawer.Root>.');
	return ctx;
}
