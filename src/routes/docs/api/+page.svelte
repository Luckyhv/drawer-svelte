<svelte:head><title>API reference - drawer-svelte</title></svelte:head>

<h1>API reference</h1>
<p class="lead">All parts are exported under the <code>Drawer</code> namespace.</p>

<h2>Drawer.Root</h2>
<table>
	<thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
	<tbody>
		<tr><td><code>open</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Bindable open state.</td></tr>
		<tr><td><code>direction</code></td><td><code>'bottom' | 'top' | 'left' | 'right'</code></td><td><code>'bottom'</code></td><td>Edge the drawer slides from (and is dragged back to).</td></tr>
		<tr><td><code>modal</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Overlay, scroll lock, focus trap, Esc / overlay tap to close. <code>false</code> leaves the page usable.</td></tr>
		<tr><td><code>dismissible</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Allow closing by drag, Esc and overlay tap.</td></tr>
		<tr><td><code>snapPoints</code></td><td><code>SnapPoint[]</code></td><td></td><td>Visible sizes: fraction of the viewport <code>(0, 1]</code>, px number, <code>'300px'</code>, or <code>(viewport) =&gt; px</code>.</td></tr>
		<tr><td><code>activeSnap</code></td><td><code>number</code></td><td></td><td>Bindable snap index (0 = smallest).</td></tr>
		<tr><td><code>defaultSnap</code></td><td><code>number</code></td><td><code>0</code></td><td>Snap index used on each open when <code>activeSnap</code> isn't bound.</td></tr>
		<tr><td><code>snapSizing</code></td><td><code>'translate' | 'height'</code></td><td><code>'translate'</code></td><td><code>translate</code>: max-size sheet slides (fastest). <code>height</code>: sized to the active snap, so a footer stays on screen.</td></tr>
		<tr><td><code>closeThreshold</code></td><td><code>number</code></td><td><code>0.25</code></td><td>Fraction of the size to drag past before a slow release closes.</td></tr>
		<tr><td><code>velocityThreshold</code></td><td><code>number</code></td><td><code>0.4</code></td><td>Release speed (px/ms) that counts as a flick.</td></tr>
		<tr><td><code>handleOnly</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Only <code>Drawer.Handle</code> / <code>Drawer.Header</code> start drags.</td></tr>
		<tr><td><code>lockScroll</code></td><td><code>boolean</code></td><td><code>modal</code></td><td>Lock page scroll while open.</td></tr>
		<tr><td><code>restoreFocus</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Return focus (without scrolling) on close.</td></tr>
		<tr><td><code>keyboardAware</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Lift bottom drawers above the on-screen keyboard.</td></tr>
		<tr><td><code>scaleNested</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Recede slightly while another drawer is open on top of this one.</td></tr>
		<tr><td><code>snapToSequentialPoint</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Every flick moves exactly one snap, instead of travelling further the harder it is.</td></tr>
		<tr><td><code>scrollLockTimeout</code></td><td><code>number</code></td><td><code>100</code></td><td>Milliseconds after the content last scrolled during which a touch scrolls instead of dragging.</td></tr>
		<tr><td><code>duration</code></td><td><code>number</code></td><td><code>450</code></td><td>Animation length in ms (0 with reduced motion).</td></tr>
		<tr><td><code>easing</code></td><td><code>string</code></td><td>iOS curve</td><td>CSS timing function.</td></tr>
		<tr><td><code>scaleBackground</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Shrink <code>[data-drawer-wrapper]</code> behind a modal bottom drawer.</td></tr>
		<tr><td><code>theme</code></td><td><code>'light' | 'dark' | 'auto'</code></td><td><code>'auto'</code></td><td>Scheme for the optional stylesheet.</td></tr>
		<tr><td><code>colors</code></td><td><code>DrawerColors</code></td><td></td><td><code>{'{'} bg, fg, muted, border, handle, overlay, shadow, accent {'}'}</code> overrides.</td></tr>
		<tr><td><code>persistKey</code></td><td><code>string</code></td><td></td><td>Remember open state and snap in localStorage.</td></tr>
		<tr><td><code>onOpenChange</code></td><td><code>(open) =&gt; void</code></td><td></td><td>Fires when the user (or code) opens/closes it.</td></tr>
		<tr><td><code>onSnapChange</code></td><td><code>(index) =&gt; void</code></td><td></td><td>Fires when a drag settles on another snap.</td></tr>
		<tr><td><code>onAnimationEnd</code></td><td><code>(open) =&gt; void</code></td><td></td><td>Fires after the close animation, once unmounted.</td></tr>
	</tbody>
</table>

<h2>Drawer.Content</h2>
<table>
	<thead><tr><th>Prop</th><th>Type</th><th>Description</th></tr></thead>
	<tbody>
		<tr><td><code>variant</code></td><td><code>'sheet' | 'floating' | 'side'</code></td><td>Preset look (needs <code>styles.css</code>). Unset = headless.</td></tr>
		<tr><td><code>ref</code></td><td><code>HTMLElement</code></td><td>Bindable element.</td></tr>
		<tr><td>…rest</td><td></td><td>Any <code>div</code> attribute (<code>class</code>, <code>style</code>, handlers).</td></tr>
	</tbody>
</table>
<h3>Data attributes</h3>
<table>
	<tbody>
		<tr><td><code>data-state</code></td><td><code>open | closed</code></td></tr>
		<tr><td><code>data-direction</code></td><td>the direction</td></tr>
		<tr><td><code>data-dragging</code></td><td>present while dragging</td></tr>
		<tr><td><code>data-snap</code></td><td>active snap index</td></tr>
		<tr><td><code>data-variant</code>, <code>data-drawer-theme</code></td><td>for styling</td></tr>
	</tbody>
</table>
<h3>CSS custom properties set on it</h3>
<table>
	<tbody>
		<tr><td><code>--drawer-hidden</code></td><td>px of the drawer below the screen at the current snap (pad scroll areas with it).</td></tr>
	</tbody>
</table>

<h2>Drawer.Overlay</h2>
<table>
	<thead><tr><th>Prop</th><th>Type</th><th>Description</th></tr></thead>
	<tbody>
		<tr><td><code>blur</code></td><td><code>boolean | number</code></td><td>Backdrop blur (<code>true</code> = 8px).</td></tr>
	</tbody>
</table>
<p>Rendered only for modal drawers. Fades with the drag once the drawer is below its smallest snap.</p>

<h2>Drawer.Portal</h2>
<table>
	<thead><tr><th>Prop</th><th>Type</th><th>Description</th></tr></thead>
	<tbody>
		<tr><td><code>to</code></td><td><code>HTMLElement | string | false</code></td><td>Target (default <code>body</code>); <code>false</code> renders in place.</td></tr>
	</tbody>
</table>

<h2>Drawer.Header</h2>
<table>
	<thead><tr><th>Prop</th><th>Type</th><th>Description</th></tr></thead>
	<tbody>
		<tr><td><code>title</code></td><td><code>string</code></td><td>Rendered as the dialog's label.</td></tr>
		<tr><td><code>description</code></td><td><code>string</code></td><td>Rendered as its description.</td></tr>
		<tr><td><code>closeButton</code></td><td><code>boolean</code></td><td>Show the × button (default <code>true</code>).</td></tr>
		<tr><td><code>actions</code></td><td><code>Snippet</code></td><td>Extra controls next to the close button.</td></tr>
	</tbody>
</table>
<p>The header is also a drag handle.</p>

<h2>Other parts</h2>
<table>
	<tbody>
		<tr><td><code>Drawer.Handle</code></td><td>Grab area. Draws a bar when empty (vertical for side drawers).</td></tr>
		<tr><td><code>Drawer.Body</code></td><td>Scroll area with <code>--drawer-hidden</code> padding.</td></tr>
		<tr><td><code>Drawer.Footer</code></td><td>Action row.</td></tr>
		<tr><td><code>Drawer.Title</code> / <code>Drawer.Description</code></td><td>Label the dialog (use these or <code>Header</code>).</td></tr>
		<tr><td><code>Drawer.Trigger</code> / <code>Drawer.Close</code></td><td>Buttons that toggle / close.</td></tr>
	</tbody>
</table>

<h2>Exports</h2>
<table>
	<tbody>
		<tr><td><code>Drawer</code></td><td>Namespace with all parts.</td></tr>
		<tr><td><code>getDrawerContext()</code></td><td>The drawer state inside any part (for custom parts): <code>open()</code>, <code>close()</code>, <code>snapTo(i)</code>, <code>activeSnap</code>, <code>dragging</code>…</td></tr>
		<tr><td><code>DEFAULT_EASE</code></td><td>The default timing function.</td></tr>
		<tr><td>types</td><td><code>Direction</code>, <code>SnapPoint</code>, <code>DrawerTheme</code>, <code>DrawerColors</code></td></tr>
		<tr><td><code>drawer-svelte/styles.css</code></td><td>Optional stylesheet.</td></tr>
	</tbody>
</table>
