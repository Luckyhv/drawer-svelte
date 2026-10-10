<script lang="ts">
	import { base } from '$app/paths';
	import Code from '$site/Code.svelte';
	import Sheet from '$site/demos/Sheet.svelte';
	import { install, quick, headless, anatomy } from '$site/snippets.js';
</script>

<svelte:head><title>Getting started - drawer-svelte</title></svelte:head>

<h1>Getting started</h1>
<p class="lead">An accessible, gesture-driven drawer for Svelte 5. Headless by default, with an optional stylesheet.</p>

<h2>Install</h2>
<Code code={install} lang="sh" title="terminal" />
<p>Requires Svelte 5.20 or newer. There are no other dependencies.</p>

<h2>Your first drawer</h2>
<Code code={quick} title="App.svelte" />
<div class="row"><Sheet /></div>
<p>
	The stylesheet is optional. It gives you the <code>sheet</code>, <code>floating</code> and
	<code>side</code> presets, light/dark themes and the default handle bar. Import it once (for example in your root
	layout).
</p>

<h2>Headless</h2>
<p>Skip the stylesheet and style each part yourself. Every part forwards <code>class</code>, <code>style</code> and any attribute.</p>
<Code code={headless} />

<h2>Anatomy</h2>
<Code code={anatomy} />
<p>
	Only <code>Root</code>, <code>Portal</code> and <code>Content</code> are required. Next: <a href="{base}/docs/usage/"
		>Usage</a
	>
	for snap points, directions, nesting and more.
</p>
