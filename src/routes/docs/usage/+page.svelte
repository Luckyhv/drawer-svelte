<script lang="ts">
	import Code from '$site/Code.svelte';
	import Snap from '$site/demos/Snap.svelte';
	import Side from '$site/demos/Side.svelte';
	import Nested from '$site/demos/Nested.svelte';
	import NonModal from '$site/demos/NonModal.svelte';
	import Form from '$site/demos/Form.svelte';
	import Scale from '$site/demos/Scale.svelte';
	import {
		snaps,
		snapForms,
		hiddenPad,
		directions,
		nonModal,
		nested,
		fullscreen,
		noDrag,
		scale,
		persist,
		controlled
	} from '$site/snippets.js';
</script>

<svelte:head><title>Usage - drawer-svelte</title></svelte:head>

<h1>Usage</h1>
<p class="lead">Everything the drawer can do, with a live demo next to each feature.</p>

<h2>Opening and closing</h2>
<p>
	Bind <code>open</code>. Users close a drawer by dragging it toward its edge (or flicking), pressing <kbd>Esc</kbd>, or tapping the
	overlay. Set <code>dismissible={'{false}'}</code> to allow none of those; your own buttons still work.
</p>
<Code code={controlled} />

<h2>Snap points</h2>
<p>
	A snap point is the <em>visible</em> size of the drawer. Releasing picks the nearest one; a flick moves one step. Dragging below the
	smallest closes the drawer. Flicks carry momentum: a light one
	moves one point, a harder one travels further and can close the drawer. Set <code>snapToSequentialPoint</code> to always move
	exactly one step.
</p>
<Code code={snaps} />
<div class="row"><Snap /></div>
<h3>Snap point values</h3>
<Code code={snapForms} lang="ts" />
<p>
	Snap points are resolved every time the viewport changes, not cached when the drawer mounts. Functions are tracked like any other
	Svelte state, so a snap point computed from your layout stays correct.
</p>
<h3>Reaching the bottom at a smaller snap</h3>
<p>
	The drawer is as tall as its largest snap point and slides down to show less. The part below the screen is exposed as
	<code>--drawer-hidden</code>; pad your scroll area with it. <code>Drawer.Body</code> does this for you.
</p>
<Code code={hiddenPad} />

<h2>Scrolling content</h2>
<p>Put long content in a scroll container (or <code>Drawer.Body</code>). The drawer decides per gesture:</p>
<ul>
	<li>Pulling toward the closed edge drags the sheet only when the list is scrolled to its start.</li>
	<li>At a smaller snap point, pulling the other way expands the sheet first, then the list scrolls.</li>
	<li>Sideways swipes (carousels) never move the sheet.</li>
	<li>Touch drags never get cancelled by native scrolling: the decision is made before the browser commits to a scroll.</li>
</ul>

<h2>Directions</h2>
<Code code={directions} />
<div class="row"><Side direction="right" /><Side direction="left" /><Side direction="top" /></div>

<h2>Non-modal</h2>
<p>For sheets that live alongside the page (a comments sheet under a playing video):</p>
<Code code={nonModal} />
<div class="row"><NonModal /></div>

<h2>Nested drawers</h2>
<Code code={nested} />
<div class="row"><Nested /></div>

<h2>Forms and the keyboard</h2>
<p>
	Drags never start on inputs, textareas, selects, sliders or contenteditable. With <code>keyboardAware</code> (default), a bottom
	drawer lifts above the on-screen keyboard while one of its fields is focused. Mark anything else with
	<code>data-drawer-no-drag</code>.
</p>
<Code code={noDrag} />
<div class="row"><Form /></div>

<h2>Fullscreen and custom containers</h2>
<p><code>Drawer.Portal</code> renders into <code>body</code> by default. Pass <code>to</code> (an element or selector), or <code>false</code> to render in place.</p>
<Code code={fullscreen} />

<h2>Background scaling</h2>
<Code code={scale} />
<div class="row"><Scale /></div>

<h2>Remembering state</h2>
<Code code={persist} />
<p>Stores the open state and snap index in <code>localStorage</code> under <code>drawer:&lt;key&gt;</code>.</p>

<h2>Behaviour you get for free</h2>
<ul>
	<li>Page scroll is locked with <code>overflow: hidden</code> on <code>&lt;html&gt;</code> (with scrollbar compensation), never by pinning <code>&lt;body&gt;</code>, so closing never jumps the page.</li>
	<li>Focus moves into the drawer on open and back to the trigger on close, both without scrolling.</li>
	<li>A drag that ends over a button doesn't click it.</li>
	<li><code>prefers-reduced-motion</code> turns animations off.</li>
	<li>Opening works in background tabs (no animation-frame waits).</li>
</ul>
