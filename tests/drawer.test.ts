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

	it('coalesces multiple touch moves into one animation frame', () => {
		const frames: FrameRequestCallback[] = [];
		const request = vi.fn((cb: FrameRequestCallback) => { frames.push(cb); return frames.length; });
		vi.stubGlobal('requestAnimationFrame', request);
		vi.stubGlobal('cancelAnimationFrame', vi.fn());
		const { el } = setup();
		touch(el, 'touchstart', 0);
		touch(el, 'touchmove', 10);
		touch(el, 'touchmove', 50);
		touch(el, 'touchmove', 100);
		expect(request).toHaveBeenCalledTimes(1);
		frames[0](0);
		expect(el.style.transform).toContain('90px');
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
		touch(el, 'touchmove', 0, 10);
		touch(el, 'touchmove', 0, 110);
		touch(el, 'touchcancel', 0, 110);
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
