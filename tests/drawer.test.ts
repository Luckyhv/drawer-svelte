// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushSync } from 'svelte';
import { createDrawer } from './fixture.svelte.js';
import { lockScroll } from '../src/lib/drawer/dom.js';

let fixtures: ReturnType<typeof createDrawer>[] = [];
function setup(...args: Parameters<typeof createDrawer>) {
	const fixture = createDrawer(...args);
	fixtures.push(fixture);
	return fixture;
}
beforeEach(() => {
	vi.stubGlobal('DOMMatrixReadOnly', class { m41 = 0; m42 = 0; });
});
afterEach(() => {
	for (const fixture of fixtures.reverse()) fixture.cleanup();
	fixtures = [];
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	vi.useRealTimers();
	document.documentElement.style.cssText = '';
});
function touch(el: HTMLElement, type: string, y: number, x = 20) {
	const point = { identifier: 1, clientX: x, clientY: y };
	const event = new Event(type, { bubbles: true, cancelable: true });
	Object.defineProperties(event, {
		touches: { value: type === 'touchend' || type === 'touchcancel' ? [] : [point] },
		changedTouches: { value: [point] }
	});
	el.dispatchEvent(event);
	flushSync();
	return event;
}

describe('drawer lifecycle and mobile gestures', () => {
	it('keeps the backdrop and panel on the same close timeline', () => {
		const { drawer, props } = setup({ duration: 450 });
		expect(drawer.overlayStyle).toContain('opacity 450ms');
		props.open = false;
		flushSync();
		expect(drawer.contentStyle).toContain('transform 315ms');
		expect(drawer.overlayStyle).toContain('opacity 315ms');
	});

	it('preserves the live position and opacity when styles are refreshed during a drag', () => {
		const { drawer, el } = setup();
		Object.defineProperty(el, 'offsetHeight', { value: 400 });
		drawer.overlayEl = document.createElement('div');
		touch(el, 'touchstart', 0);
		touch(el, 'touchmove', 10);
		touch(el, 'touchmove', 50);
		touch(el, 'touchmove', 150);
		expect(el.style.transform).toBe('translate3d(0, 100px, 0)');
		// Svelte rewrites the style attribute when another tracked input changes.
		expect(drawer.contentStyle).toContain(`transform: ${el.style.transform}`);
		expect(drawer.overlayStyle).toContain('opacity: 0.75;');
		touch(el, 'touchcancel', 150);
	});

	it('reopening during close releases the page lock and restores the original focus', () => {
		vi.useFakeTimers();
		const trigger = document.createElement('button');
		document.body.append(trigger);
		trigger.focus();
		const { drawer, props, el } = setup();
		expect(document.documentElement.style.overflow).toBe('hidden');
		props.open = false;
		flushSync();
		props.open = true;
		flushSync();
		props.open = false;
		flushSync();
		el.dispatchEvent(new Event('transitionend'));
		vi.advanceTimersByTime(600);
		flushSync();
		expect(drawer.mounted).toBe(false);
		expect(document.documentElement.style.overflow).toBe('');
		expect(document.activeElement).toBe(trigger);
		trigger.remove();
	});

	it('allows native scrolling rather than stealing a touch inside a scrolled list', () => {
		const { drawer, el } = setup();
		expect(drawer.contentStyle).toContain('touch-action: auto');
		const list = document.createElement('div');
		list.style.overflowY = 'auto';
		Object.defineProperties(list, { scrollHeight: { value: 1000 }, clientHeight: { value: 200 } });
		list.scrollTop = 100;
		el.append(list);
		touch(list, 'touchstart', 100);
		expect(touch(list, 'touchmove', 140).defaultPrevented).toBe(false);
		expect(drawer.dragging).toBe(false);
		touch(list, 'touchend', 140);
	});

	it('hands a browser-scrolled list over to the sheet once it reaches the top', () => {
		const { drawer, props, el } = setup();
		const list = document.createElement('div');
		list.style.overflowY = 'auto';
		Object.defineProperties(list, { scrollHeight: { value: 1000 }, clientHeight: { value: 200 } });
		list.scrollTop = 100;
		el.append(list);
		touch(list, 'touchstart', 100);
		// The list is scrolled, so the browser takes the pull and scrolls it up.
		expect(touch(list, 'touchmove', 140).defaultPrevented).toBe(false);
		expect(list.style.overscrollBehaviorY).toBe('none');
		list.scrollTop = 0;
		touch(list, 'touchmove', 200);
		expect(drawer.dragging).toBe(false);
		// Still pulling at the top: the sheet follows from here.
		touch(list, 'touchmove', 260);
		expect(drawer.dragging).toBe(true);
		// Pushing back past where the pull began returns the touch to the list.
		touch(list, 'touchmove', 190);
		touch(list, 'touchend', 190);
		expect(drawer.dragging).toBe(false);
		expect(props.open).toBe(true);
		expect(drawer.drag).toBe(0);
	});
	it('pulling down at the top captures a drag and cancellation springs back without closing', () => {
		const { drawer, props, el } = setup();
		const list = document.createElement('div');
		list.style.overflowY = 'auto';
		Object.defineProperties(list, { scrollHeight: { value: 1000 }, clientHeight: { value: 200 } });
		el.append(list);
		touch(list, 'touchstart', 100);
		expect(touch(list, 'touchmove', 120).defaultPrevented).toBe(true);
		touch(list, 'touchmove', 500);
		expect(drawer.dragging).toBe(true);
		touch(list, 'touchcancel', 500);
		expect(drawer.dragging).toBe(false);
		expect(props.open).toBe(true);
		expect(drawer.drag).toBe(0);
	});

	it('ignores cancellation of a second finger while the original drag continues', () => {
		const { drawer, el } = setup();
		touch(el, 'touchstart', 0);
		touch(el, 'touchmove', 10);
		const event = new Event('touchcancel', { bubbles: true });
		Object.defineProperty(event, 'changedTouches', { value: [{ identifier: 2 }] });
		el.dispatchEvent(event);
		expect(drawer.dragging).toBe(true);
		touch(el, 'touchcancel', 10);
	});

	it('closing a lower drawer does not steal focus from the top drawer', () => {
		vi.useFakeTimers();
		const lower = setup({ duration: 0 });
		const upper = setup();
		lower.props.open = false;
		flushSync();
		vi.advanceTimersByTime(0);
		flushSync();
		expect(document.activeElement).toBe(upper.el);
		expect(document.documentElement.style.overflow).toBe('hidden');
	});

	it('paints each touch move without waiting for an animation frame', () => {
		const request = vi.fn();
		vi.stubGlobal('requestAnimationFrame', request);
		const { el } = setup();
		touch(el, 'touchstart', 0);
		touch(el, 'touchmove', 10);
		touch(el, 'touchmove', 50);
		touch(el, 'touchmove', 100);
		expect(request).not.toHaveBeenCalled();
		// The sheet follows from where the touch stopped being a possible tap.
		expect(el.style.transform).toContain('50px');
		touch(el, 'touchcancel', 100);
	});

	it('only the top drawer can start a gesture', () => {
		const lower = setup();
		setup();
		touch(lower.el, 'touchstart', 100);
		touch(lower.el, 'touchmove', 200);
		expect(lower.drawer.dragging).toBe(false);
	});

	it('resolves snap functions once until their reactive inputs change', () => {
		const point = vi.fn((viewport: number) => viewport / 2);
		const { drawer } = setup({ snapPoints: [point, 0.9] });
		void drawer.snapSizes;
		point.mockClear();
		for (let i = 0; i < 10; i++) { void drawer.snapSizes; void drawer.resting; void drawer.contentStyle; }
		expect(point).not.toHaveBeenCalled();
		drawer.viewport.h = 1000;
		expect(drawer.snapSizes).toEqual([500, 900]);
		expect(point).toHaveBeenCalledTimes(1);
	});

	it('fades a side drawer against its width rather than its height', () => {
		const { drawer, el } = setup({ direction: 'right' });
		Object.defineProperties(el, { offsetWidth: { value: 200 }, offsetHeight: { value: 800 } });
		drawer.overlayEl = document.createElement('div');
		touch(el, 'touchstart', 0, 0);
		touch(el, 'touchmove', 0, 20);
		touch(el, 'touchmove', 0, 120);
		touch(el, 'touchcancel', 0, 120);
		expect(Number(drawer.overlayEl.style.opacity)).toBeCloseTo(0.5);
	});

	it('restores background styles when a scaled drawer is destroyed', () => {
		const wrapper = document.createElement('main');
		wrapper.setAttribute('data-drawer-wrapper', '');
		wrapper.style.cssText = 'transform: translateX(5px); overflow: auto; border-radius: 4px; transition: opacity 1s;';
		document.body.append(wrapper);
		const original = wrapper.style.cssText;
		const { drawer } = setup({ scaleBackground: true });
		expect(wrapper.style.transform).toContain('scale');
		drawer.destroy();
		expect(wrapper.style.cssText).toBe(original);
		wrapper.remove();
	});

	it('reports both zero-duration open and close animations', () => {
		vi.useFakeTimers();
		const onAnimationEnd = vi.fn();
		const { props } = setup({ duration: 0 }, { onAnimationEnd });
		vi.advanceTimersByTime(0);
		expect(onAnimationEnd).toHaveBeenCalledWith(true);
		props.open = false;
		flushSync();
		vi.advanceTimersByTime(0);
		flushSync();
		expect(onAnimationEnd.mock.calls).toEqual([[true], [false]]);
	});

	it('cleans up an interrupted pointer drag and preserves existing user selection styles', () => {
		document.documentElement.style.userSelect = 'text';
		const { drawer, props, el } = setup();
		el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse', isPrimary: true, pointerId: 3, clientY: 100 }));
		window.dispatchEvent(new PointerEvent('pointermove', { pointerId: 3, clientY: 120 }));
		flushSync();
		expect(drawer.dragging).toBe(true);
		expect(document.documentElement.style.userSelect).toBe('none');
		props.open = false;
		flushSync();
		expect(document.documentElement.style.userSelect).toBe('text');
		window.dispatchEvent(new PointerEvent('pointermove', { pointerId: 3, clientY: 400 }));
		expect(drawer.dragging).toBe(false);
	});
});

describe('taps and drags over a list', () => {
	function scene(scrollTop = 0, attrs: Record<string, string> = {}) {
		const frames: FrameRequestCallback[] = [];
		vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
		vi.stubGlobal('cancelAnimationFrame', vi.fn());
		const fixture = setup();
		Object.defineProperty(fixture.el, 'offsetHeight', { value: 400 });
		const list = document.createElement('div');
		list.style.overflowY = 'auto';
		Object.defineProperties(list, { scrollHeight: { value: 1000 }, clientHeight: { value: 200 } });
		list.scrollTop = scrollTop;
		for (const [name, value] of Object.entries(attrs)) list.setAttribute(name, value);
		const button = document.createElement('button');
		list.append(button);
		fixture.el.append(list);
		const onClick = vi.fn();
		button.addEventListener('click', onClick);
		/** Finger down at 100, wandering a pixel at a time to `100 + drift`, then up. The browser clicks. */
		const tap = (drift: number) => {
			touch(button, 'touchstart', 100);
			for (let y = 1; y <= drift; y++) {
				touch(button, 'touchmove', 100 + y);
				frames.splice(0).forEach((frame) => frame(0));
			}
			const moved = fixture.el.style.transform;
			touch(button, 'touchend', 100 + drift);
			button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
			return moved;
		};
		return { ...fixture, list, button, onClick, tap };
	}
	const still = (transform: string) => transform === '' || /translate3d\(0(px)?, 0px, 0(px)?\)/.test(transform);

	it.each([2, 5, 10])('a tap that drifts %ipx still clicks and leaves the sheet where it is', (drift) => {
		const { props, onClick, tap } = scene();
		expect(still(tap(drift))).toBe(true);
		expect(onClick).toHaveBeenCalledTimes(1);
		expect(props.open).toBe(true);
	});

	it('a tap that wanders up and back down does not move the sheet or the list', () => {
		const { drawer, button, onClick, el } = scene();
		touch(button, 'touchstart', 100);
		for (const y of [99, 98, 100, 103, 104]) touch(button, 'touchmove', y);
		expect(still(el.style.transform)).toBe(true);
		touch(button, 'touchend', 104);
		button.click();
		expect(onClick).toHaveBeenCalledTimes(1);
		expect(drawer.drag).toBe(0);
	});

	it('a 12px drift is a drag: the sheet follows and the element under the finger is not clicked', () => {
		const { onClick, tap } = scene();
		expect(still(tap(12))).toBe(false);
		expect(onClick).not.toHaveBeenCalled();
	});

	it('pulling a list down from its top closes the drawer without clicking', () => {
		const { props, button, onClick } = scene();
		touch(button, 'touchstart', 100);
		for (let y = 101; y <= 400; y += 13) expect(touch(button, 'touchmove', y).defaultPrevented).toBe(true);
		touch(button, 'touchend', 400);
		button.click();
		expect(onClick).not.toHaveBeenCalled();
		expect(props.open).toBe(false);
	});

	it('a list that is not at its top scrolls, and a tap in it clicks', () => {
		const { drawer, onClick, tap, button } = scene(100);
		tap(5);
		expect(onClick).toHaveBeenCalledTimes(1);
		touch(button, 'touchstart', 100);
		expect(touch(button, 'touchmove', 160).defaultPrevented).toBe(false);
		expect(drawer.dragging).toBe(false);
		touch(button, 'touchend', 160);
	});

	it('a handle moves the sheet from the first pixels', () => {
		const { tap } = scene(0, { 'data-drawer-handle': '' });
		expect(still(tap(5))).toBe(false);
	});

	it('a mouse drag of a few pixels still swallows the click', () => {
		const { el, button, onClick } = scene();
		button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse', isPrimary: true, pointerId: 3, clientY: 100 }));
		for (const y of [105, 109]) window.dispatchEvent(new PointerEvent('pointermove', { pointerId: 3, clientY: y }));
		window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 3, clientY: 109 }));
		button.click();
		expect(onClick).not.toHaveBeenCalled();
		expect(el.style.transform).toContain('4px');
	});
});

describe('page scroll lock', () => {
	it('adds scrollbar compensation to existing padding and restores it after the last release', () => {
		vi.stubGlobal('innerWidth', 800);
		vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(780);
		document.documentElement.style.paddingRight = '12px';
		const releaseA = lockScroll();
		const releaseB = lockScroll();
		expect(document.documentElement.style.paddingRight).toBe('32px');
		releaseA(); releaseA();
		expect(document.documentElement.style.overflow).toBe('hidden');
		releaseB();
		expect(document.documentElement.style.paddingRight).toBe('12px');
	});
});
