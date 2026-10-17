/**
 * Pure geometry for the drawer: snap point resolution, release decisions and
 * rubber-banding. No DOM, so it is unit-tested directly.
 *
 * Conventions: every distance is measured along the drawer's axis, in px,
 * as an OFFSET from fully open toward closed. 0 = fully open (largest snap),
 * `size` = fully closed (off screen). "Toward close" is positive.
 */

export type Direction = 'bottom' | 'top' | 'left' | 'right';

/**
 * A snap point is the VISIBLE size of the drawer:
 * - a number in (0, 1]: a fraction of the viewport along the axis,
 * - a number > 1 or a `"300px"` string: pixels,
 * - a function of the viewport size returning pixels.
 */
export type SnapPoint = number | `${number}px` | ((viewport: number) => number);

export function isVertical(direction: Direction): boolean {
	return direction === 'bottom' || direction === 'top';
}

/** Resolve snap points to pixel sizes, ascending, clamped to the viewport. */
export function resolveSnapSizes(points: readonly SnapPoint[], viewport: number): number[] {
	const sizes = points.map((p) => {
		let px: number;
		if (typeof p === 'function') px = p(viewport);
		else if (typeof p === 'string') px = parseFloat(p);
		else px = p <= 1 ? p * viewport : p;
		return Math.round(Math.max(0, Math.min(px, viewport)));
	});
	return [...new Set(sizes)].filter((s) => s > 0).sort((a, b) => a - b);
}

/** Resting offset of snap `index` when the drawer is `max` px tall. */
export function snapOffset(sizes: readonly number[], index: number, max: number): number {
	const i = Math.max(0, Math.min(index, sizes.length - 1));
	return max - (sizes[i] ?? max);
}

/**
 * Rubber band past a hard edge: the further you pull, the less it moves.
 * Same curve family as iOS scroll views.
 */
export function dampen(distance: number, dimension = 400): number {
	if (distance <= 0) return 0;
	const c = 0.55;
	return (1 - 1 / ((distance * c) / dimension + 1)) * dimension;
}

export type ReleaseInput = {
	/** Current offset (resting + drag), px toward closed. */
	offset: number;
	/** Release velocity, px/ms, positive toward closed. */
	velocity: number;
	/** Drawer size along the axis (largest snap, or measured content size). */
	size: number;
	/** Ascending visible sizes; empty = no snap points. */
	snapSizes: readonly number[];
	/** Snap index the drag started from. */
	activeIndex: number;
	dismissible: boolean;
	/** Fraction of the (smallest) visible size to drag past before closing. */
	closeThreshold: number;
	/** px/ms that counts as a flick. */
	velocityThreshold: number;
	/**
	 * ms of momentum a flick carries: it lands on the snap nearest to
	 * `offset + velocity * momentum`, so a harder flick travels further.
	 * 0 (default) moves exactly one snap per flick.
	 */
	momentum?: number;
};

export type ReleaseResult = { action: 'close' } | { action: 'snap'; index: number };

/** Where the drawer goes when the finger lets go. */
export function decideRelease(input: ReleaseInput): ReleaseResult {
	const { offset, velocity, size, snapSizes, activeIndex, dismissible, closeThreshold } = input;
	const flick = Math.abs(velocity) >= input.velocityThreshold;

	if (snapSizes.length === 0) {
		const closing = (flick && velocity > 0) || offset > size * closeThreshold;
		return dismissible && closing ? { action: 'close' } : { action: 'snap', index: 0 };
	}

	const last = snapSizes.length - 1;
	const offsets = snapSizes.map((_, i) => snapOffset(snapSizes, i, size));

	if (flick) {
		// Momentum: carry the release forward and land where it would coast to,
		// but always at least one snap in the flick's direction.
		if (input.momentum) {
			const projected = offset + velocity * input.momentum;
			let landing = 0;
			for (let i = 1; i < offsets.length; i++) {
				if (Math.abs(offsets[i] - projected) < Math.abs(offsets[landing] - projected)) landing = i;
			}
			if (velocity < 0) return { action: 'snap', index: Math.max(landing, Math.min(last, activeIndex + 1)) };
			// Coasting more than half way out of the smallest snap leaves the screen.
			const leaves = projected > offsets[0] + snapSizes[0] * 0.5;
			const index = Math.min(landing, activeIndex - 1);
			if (dismissible && (leaves || index < 0)) return { action: 'close' };
			return { action: 'snap', index: Math.max(0, index) };
		}
		// Otherwise one step per flick.
		if (velocity > 0) {
			if (activeIndex > 0) return { action: 'snap', index: activeIndex - 1 };
			return dismissible ? { action: 'close' } : { action: 'snap', index: 0 };
		}
		return { action: 'snap', index: Math.min(last, activeIndex + 1) };
	}

	// Past the smallest snap by the threshold: close.
	const smallest = snapSizes[0];
	if (dismissible && offset > offsets[0] + smallest * closeThreshold) return { action: 'close' };

	// Otherwise the nearest snap.
	let best = 0;
	for (let i = 1; i < offsets.length; i++) {
		if (Math.abs(offsets[i] - offset) < Math.abs(offsets[best] - offset)) best = i;
	}
	return { action: 'snap', index: best };
}

/** Velocity (px/ms) over the most recent ~100ms of samples. */
export function velocityOf(samples: readonly { v: number; t: number }[], window = 100): number {
	if (samples.length < 2) return 0;
	const last = samples[samples.length - 1];
	let first = samples[0];
	for (const s of samples) {
		if (last.t - s.t <= window) {
			first = s;
			break;
		}
	}
	const dt = last.t - first.t;
	return dt > 0 ? (last.v - first.v) / dt : 0;
}

/**
 * Easing for a release: a curve that leaves at the finger's speed and eases
 * to rest, instead of starting at a fixed pace whatever the finger was doing.
 * From a standstill it accelerates gently; after a flick it carries the
 * flick's speed. `velocity` is px/ms toward the target (negative = moving
 * away). A `flick` settles past the target by ~1-3% (more for harder flicks)
 * and back, like Apple's sheet spring (damping 0.8); anything slower never
 * overshoots. Being a plain cubic-bezier it runs on the compositor in every
 * browser.
 */
export function springEasing(distance: number, velocity: number, duration: number, flick = false): string {
	// Start slope: how fast the finger was going relative to a linear run.
	const slope = distance > 0 ? Math.max(-1, Math.min((velocity * duration) / distance, 8)) : 0;
	// A bezier starts with slope y1/x1. Keep y1 within 1 so the start cannot overshoot.
	const x1 = slope * 0.3 <= 1 ? 0.3 : 1 / slope;
	const y1 = slope * x1;
	// y2 past 1 lands the curve from beyond the target: peaks 1-3%, matching a 0.8-damped spring.
	return `cubic-bezier(${+x1.toFixed(3)}, ${+y1.toFixed(3)}, 0.2, ${flick ? 1.1 : 1})`;
}
