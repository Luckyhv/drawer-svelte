import { describe, expect, it } from 'vitest';
import { dampen, decideRelease, springEasing, resolveSnapSizes, snapOffset, velocityOf } from './math.js';

describe('resolveSnapSizes', () => {
	it('resolves fractions, px numbers, px strings and functions, ascending', () => {
		expect(resolveSnapSizes([0.5, '200px', 300, (vh) => vh - 100], 800)).toEqual([200, 300, 400, 700]);
	});
	it('clamps to the viewport and drops duplicates / zero', () => {
		expect(resolveSnapSizes([2000, 1, 0, '0px'], 800)).toEqual([800]);
	});
});

describe('snapOffset', () => {
	it('is max minus the visible size', () => {
		expect(snapOffset([300, 700], 0, 700)).toBe(400);
		expect(snapOffset([300, 700], 1, 700)).toBe(0);
	});
});

describe('dampen', () => {
	it('is monotonic and sub-linear', () => {
		expect(dampen(0)).toBe(0);
		expect(dampen(100)).toBeLessThan(100);
		expect(dampen(200)).toBeGreaterThan(dampen(100));
	});
});

const base = {
	velocity: 0,
	size: 700,
	snapSizes: [] as number[],
	activeIndex: 0,
	dismissible: true,
	closeThreshold: 0.25,
	velocityThreshold: 0.4
};

describe('decideRelease without snaps', () => {
	it('springs back under the threshold', () => {
		expect(decideRelease({ ...base, offset: 100 })).toEqual({ action: 'snap', index: 0 });
	});
	it('closes past the threshold', () => {
		expect(decideRelease({ ...base, offset: 200 })).toEqual({ action: 'close' });
	});
	it('closes on a downward flick', () => {
		expect(decideRelease({ ...base, offset: 20, velocity: 0.8 })).toEqual({ action: 'close' });
	});
	it('never closes when not dismissible', () => {
		expect(decideRelease({ ...base, offset: 600, dismissible: false })).toEqual({
			action: 'snap',
			index: 0
		});
	});
});

describe('decideRelease with snaps', () => {
	const snaps = { ...base, snapSizes: [300, 700] }; // offsets 400, 0
	it('flick down steps one snap smaller', () => {
		expect(decideRelease({ ...snaps, activeIndex: 1, offset: 30, velocity: 0.9 })).toEqual({
			action: 'snap',
			index: 0
		});
	});
	it('flick down from the smallest closes', () => {
		expect(decideRelease({ ...snaps, activeIndex: 0, offset: 420, velocity: 0.9 })).toEqual({
			action: 'close'
		});
	});
	it('flick up steps one snap larger', () => {
		expect(decideRelease({ ...snaps, activeIndex: 0, offset: 380, velocity: -0.9 })).toEqual({
			action: 'snap',
			index: 1
		});
	});
	it('slow release picks the nearest snap', () => {
		expect(decideRelease({ ...snaps, activeIndex: 1, offset: 150 })).toEqual({ action: 'snap', index: 1 });
		expect(decideRelease({ ...snaps, activeIndex: 1, offset: 300 })).toEqual({ action: 'snap', index: 0 });
	});
	it('slow drag past the smallest snap by the threshold closes', () => {
		expect(decideRelease({ ...snaps, activeIndex: 0, offset: 400 + 300 * 0.3 })).toEqual({
			action: 'close'
		});
	});
});

describe('velocityOf', () => {
	it('uses the last ~100ms', () => {
		const s = [
			{ v: 0, t: 0 },
			{ v: 10, t: 200 },
			{ v: 60, t: 250 },
			{ v: 110, t: 300 }
		];
		expect(velocityOf(s)).toBeCloseTo(1, 5);
	});
});

describe('decideRelease with momentum', () => {
	// Offsets for these sizes in a 700px drawer: 500, 300, 0.
	const snaps = { ...base, snapSizes: [200, 400, 700], momentum: 150 };
	it('a hard flick up coasts to fully open', () => {
		expect(decideRelease({ ...snaps, activeIndex: 0, offset: 480, velocity: -2.5 })).toEqual({ action: 'snap', index: 2 });
	});
	it('a medium flick down from the top lands on the middle snap', () => {
		expect(decideRelease({ ...snaps, activeIndex: 2, offset: 40, velocity: 1.5 })).toEqual({ action: 'snap', index: 1 });
	});
	it('a harder flick down skips to the smallest snap', () => {
		expect(decideRelease({ ...snaps, activeIndex: 2, offset: 40, velocity: 3 })).toEqual({ action: 'snap', index: 0 });
	});
	it('a very hard flick down closes', () => {
		expect(decideRelease({ ...snaps, activeIndex: 2, offset: 40, velocity: 5 })).toEqual({ action: 'close' });
	});
	it('falls to the smallest snap when not dismissible', () => {
		expect(decideRelease({ ...snaps, activeIndex: 2, offset: 40, velocity: 5, dismissible: false })).toEqual({
			action: 'snap',
			index: 0
		});
	});
	it('a light flick still moves one snap', () => {
		expect(decideRelease({ ...snaps, activeIndex: 2, offset: 10, velocity: 0.5 })).toEqual({ action: 'snap', index: 1 });
		expect(decideRelease({ ...snaps, activeIndex: 0, offset: 495, velocity: -0.5 })).toEqual({ action: 'snap', index: 1 });
	});
	it('a flick down from the smallest snap closes', () => {
		expect(decideRelease({ ...snaps, activeIndex: 0, offset: 520, velocity: 0.6 })).toEqual({ action: 'close' });
	});
});

describe('springEasing', () => {
	const points = (easing: string) => easing.slice(13, -1).split(', ').map(Number);
	it('starts flat from rest', () => {
		expect(springEasing(300, 0, 450)).toBe('cubic-bezier(0.3, 0, 0.2, 1)');
	});
	it('starts at the finger speed after a flick', () => {
		// 1 px/ms over 300px in 450ms is 1.5x a linear run.
		const [x1, y1] = points(springEasing(300, 1, 450));
		expect(y1 / x1).toBeCloseTo(1.5, 2);
	});
	it('never overshoots, however hard the flick', () => {
		for (const velocity of [2, 5, 50]) {
			const [x1, y1, x2, y2] = points(springEasing(300, velocity, 450));
			expect(y1).toBeLessThanOrEqual(1);
			expect(x1).toBeGreaterThan(0);
			expect([x2, y2]).toEqual([0.2, 1]);
		}
	});
	it('a flick settles slightly past the target and back', () => {
		const peak = (easing: string) => {
			const [, y1, , y2] = points(easing);
			let max = 0;
			for (let t = 0; t <= 1; t += 0.001) max = Math.max(max, 3 * (1 - t) ** 2 * t * y1 + 3 * (1 - t) * t * t * y2 + t ** 3);
			return max;
		};
		const soft = peak(springEasing(300, 0.5, 450, true));
		const hard = peak(springEasing(300, 5, 450, true));
		expect(soft).toBeGreaterThan(1.005);
		expect(hard).toBeGreaterThan(soft);
		expect(hard).toBeLessThan(1.04);
		expect(points(springEasing(300, 5, 450, true)).at(-1)).toBe(1.1);
	});
	it('a slow release never overshoots', () => {
		expect(points(springEasing(300, 0.2, 450)).at(-1)).toBe(1);
	});
	it('drifts back briefly when released moving away', () => {
		expect(points(springEasing(300, -0.5, 450))[1]).toBeLessThan(0);
	});
});
