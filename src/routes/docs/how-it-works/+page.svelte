<script lang="ts">
	import Code from '$site/Code.svelte';
	const tree = `src/lib/
  index.ts            public exports
  styles.css          optional stylesheet (themes, variants)
  drawer/
    math.ts           pure geometry: snap sizes, release decision, rubber band, velocity
    dom.ts            scroll lock, layer stack, portal, scroll-parent detection, focus helpers
    state.svelte.ts   DrawerState: lifecycle, styles, gestures, keyboard, focus (runes)
    Root.svelte       props -> DrawerState, context, persistence
    Content.svelte    the dialog element; attaches gestures; renders state as style
    Overlay / Portal / Handle / Header / Body / Footer / Title / Description / Trigger / Close`;
	const offset = `offset = resting + drag          // px toward closed, 0 = fully open
resting = maxSnap - activeSnapSize  // 0 without snap points
transform = translate(offset)        // along the axis, sign by direction
closed  = translate(calc(100% + gap + 8px))  // gap = measured margin`;
	const decide = `pending --(moved 5px)--> decide:
  sideways?                         -> ignore (let carousels work)
  toward closed:  scroller at start? -> drag   else ignore (native scroll)
  toward open:    below top snap?   -> drag (expand)
                  at top snap        -> drag only from a non-scrolling area
drag  -> preventDefault each touchmove (the browser never takes over)`;
	const release = `velocity >= threshold ? one snap step (or close past the smallest)
: past smallest by closeThreshold ? close
: nearest snap`;
</script>

<svelte:head><title>How it works - drawer-svelte</title></svelte:head>

<h1>How it works</h1>
<p class="lead">
	The design decisions behind drawer-svelte, and the bugs in other drawers that each one avoids. Useful if you want to contribute,
	debug, or build a custom part.
</p>

<h2>Layout of the code</h2>
<Code code={tree} lang="txt" title="source" />
<p>
	All behaviour lives in one class, <code>DrawerState</code>, built with Svelte 5 runes. The components are thin: they read state
	(<code>contentStyle</code>, <code>overlayStyle</code>, <code>state</code>) and forward attributes. The maths is pure TypeScript with
	unit tests, so the trickiest decisions are tested without a browser.
</p>

<h2>One number: the offset</h2>
<p>
	The drawer's position is a single value, its <em>offset</em> in pixels toward the closed edge. Everything renders from it:
</p>
<Code code={offset} lang="txt" title="geometry" />
<p>
	Only <code>transform</code> changes while dragging, so the browser can animate on the compositor without layout. With snap points,
	the element is as tall as the largest snap and slides down to show less. That's why <code>--drawer-hidden</code> exists: it tells
	scroll areas how much of them is below the screen.
</p>
<p>
	Snap points are a reactive derived value over the current viewport and props. They are reused during gestures and recalculated when those inputs change. Measuring once at mount is the classic
	bug where a sheet opened from a different scroll position lands in the wrong place.
</p>

<h2>Lifecycle</h2>
<ol>
	<li><strong>opening</strong>: the content mounts parked off-screen with no transition.</li>
	<li>We measure its margin from the edge (the <code>gap</code>, so floating drawers fully hide), focus it with <code>preventScroll</code>, force a style read, and switch to <strong>open</strong> straight away. The transition plays from the parked position. No <code>requestAnimationFrame</code> wait, so it also opens in a background tab.</li>
	<li><strong>closing</strong>: the transform goes back to the parked value. If the user dragged, it starts from where the finger left it.</li>
	<li>On <code>transitionend</code> (or a timer, because transitions can be skipped) it unmounts, releases the scroll lock, leaves the layer stack and restores focus without scrolling.</li>
</ol>

<h2>Gestures</h2>
<p>
	Touch uses <strong>touch events</strong>, not pointer events. A pointer drag is cancelled with <code>pointercancel</code> the moment
	the browser decides a touch is a scroll, and that is what makes drawers freeze half-dragged inside lists. With
	<code>touchmove</code> registered as non-passive, we decide in the first few pixels and call <code>preventDefault</code>, so the
	browser does not take an accepted drag. Content keeps <code>touch-action: auto</code> for native scrolling; handles use <code>none</code>. Drag painting is coalesced into one update per animation frame. Mouse and pen use pointer events with window listeners.
</p>
<Code code={decide} lang="txt" title="per gesture" />
<p>
	Pulling past fully open is rubber-banded with the same curve family iOS uses. A drag that moves more than a few pixels swallows the
	click that follows it, so releasing over a button doesn't press it.
</p>

<h2>Release</h2>
<Code code={release} lang="txt" title="decideRelease (math.ts)" />
<p>Velocity is measured over the last ~100&nbsp;ms of samples, not the whole drag, so a slow drag that ends with a flick still counts as a flick.</p>

<h2>Layers, Escape and focus</h2>
<p>
	Open drawers push themselves onto a module-level stack. The Escape handler, overlay taps and the Tab focus trap only act if the
	drawer is on top. A picker opened from another sheet closes on its own, and the sheet underneath stays open. Gestures check
	that the touched element belongs to this drawer's content, so a drawer portaled on top never drives the one below.
</p>

<h2>Scroll lock without jumps</h2>
<p>
	Many drawers lock scrolling by setting <code>position: fixed</code> on <code>body</code> and then scrolling back on close. On iOS that
	causes visible jumps, and it fights with the keyboard. drawer-svelte sets <code>overflow: hidden</code> on <code>&lt;html&gt;</code>
	(ref-counted for nested drawers, with scrollbar-width compensation) and never moves the page.
</p>

<h2>The keyboard</h2>
<p>
	For bottom drawers, a <code>visualViewport</code> listener measures how much of the layout viewport the on-screen keyboard covers
	while a field inside the drawer is focused, and subtracts it from the offset. Viewport resizes caused by the keyboard are ignored for
	snap points, so the sheet doesn't jump when the keyboard opens.
</p>

<h2>Theming</h2>
<p>
	The stylesheet defines private tokens (<code>--_bg</code>…) per theme on the drawer elements, and every rule reads
	<code>var(--drawer-bg, var(--_bg))</code>. Public variables set anywhere above (or from the <code>colors</code> prop, which writes them
	inline) win over the theme, and <code>:where()</code> keeps every selector at zero specificity so your classes win over the
	stylesheet.
</p>

<h2>Testing</h2>
<ul>
	<li><code>npm test</code>: unit tests for snap resolution, release decisions, rubber banding and velocity.</li>
	<li><code>npm run check</code>: svelte-check on the library and site.</li>
	<li><code>npm run package</code>: builds <code>dist/</code> and runs publint.</li>
	<li>The demo pages double as manual tests: open them on a real phone (<code>npm run dev</code> listens on your LAN).</li>
</ul>
