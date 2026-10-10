<script lang="ts">
	import Code from '$site/Code.svelte';
	import Theme from '$site/demos/Theme.svelte';
	import { themeVars, themeProp, perDrawer, tailwindTheme, headless } from '$site/snippets.js';
</script>

<svelte:head><title>Theming - drawer-svelte</title></svelte:head>

<h1>Theming</h1>
<p class="lead">Headless, a preset, or your users' own colours. Pick per project, or mix per drawer.</p>

<div class="callout">Try it: switch this site's theme with the button in the top bar, then open the drawer below on <em>auto</em>.</div>
<div style="margin-top: 16px"><Theme /></div>

<h2>1. The preset stylesheet</h2>
<p>
	<code>import 'drawer-svelte/styles.css'</code> once, then add <code>variant="sheet"</code>, <code>"floating"</code> or
	<code>"side"</code> to <code>Drawer.Content</code>. The overlay, handle bar, header, body and footer get matching styles.
	All rules use <code>:where()</code>, so any class you add wins without <code>!important</code>.
</p>

<h2>2. Light, dark and auto</h2>
<p>
	<code>theme="auto"</code> (default) is dark when the OS prefers dark, or when an ancestor has <code>.dark</code> /
	<code>[data-theme="dark"]</code>; <code>.light</code> / <code>[data-theme="light"]</code> forces light. Because drawers are portaled
	to <code>body</code>, put that class on <code>&lt;html&gt;</code> (most theme switchers already do).
</p>
<Code code={themeProp} />

<h2>3. CSS variables</h2>
<p>
	Every colour, the radius, margins, width and z-index read a public <code>--drawer-*</code> property first and fall back to the
	theme. Set them globally, inside a theme class, or on one drawer.
</p>
<Code code={themeVars} lang="css" title="app.css" />
<Code code={perDrawer} />
<Code code={tailwindTheme} />

<h2>4. Users' own colours</h2>
<p>
	The <code>colors</code> prop turns an object into those same variables on the drawer and its overlay. Feed it straight from your
	settings store, so each user's palette applies without any CSS.
</p>

<h2>5. Fully custom</h2>
<p>Leave <code>variant</code> unset (and skip the stylesheet if you like) and style every part yourself.</p>
<Code code={headless} />

<h2>Variables</h2>
<table>
	<thead><tr><th>Property</th><th>Used for</th></tr></thead>
	<tbody>
		<tr><td><code>--drawer-bg</code> / <code>--drawer-fg</code></td><td>surface and text</td></tr>
		<tr><td><code>--drawer-muted</code></td><td>descriptions, close icon</td></tr>
		<tr><td><code>--drawer-border</code></td><td>outline and dividers</td></tr>
		<tr><td><code>--drawer-handle</code></td><td>handle bar</td></tr>
		<tr><td><code>--drawer-overlay</code></td><td>backdrop colour</td></tr>
		<tr><td><code>--drawer-shadow</code></td><td>box shadow</td></tr>
		<tr><td><code>--drawer-accent</code> / <code>--drawer-hover</code></td><td>for your own buttons inside</td></tr>
		<tr><td><code>--drawer-radius</code></td><td>corner radius (20px)</td></tr>
		<tr><td><code>--drawer-gap</code></td><td>floating variant margin (8px)</td></tr>
		<tr><td><code>--drawer-width</code></td><td>side drawers (min(380px, 88vw))</td></tr>
		<tr><td><code>--drawer-max-height</code></td><td>sheet / floating height cap</td></tr>
		<tr><td><code>--drawer-z</code></td><td>overlay z-index (content is +1), default 50</td></tr>
	</tbody>
</table>
