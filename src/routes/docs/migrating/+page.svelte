<script lang="ts">
	import Code from '$site/Code.svelte';
	import { vaulMigration } from '$site/snippets.js';
</script>

<svelte:head><title>Migrating from vaul - drawer-svelte</title></svelte:head>

<h1>Migrating from vaul-svelte</h1>
<p class="lead">The part names match, so most drawers only need the import changed.</p>
<Code code={vaulMigration} lang="diff" />
<h2>Things you can delete</h2>
<ul>
	<li>Workarounds for the page jumping on close: there's no <code>position: fixed</code> on <code>body</code>.</li>
	<li>Custom drag code for scroll areas: the scroll handoff is built in.</li>
	<li>Measuring snap points before opening: they're resolved live.</li>
	<li>Preventing focus restoration to stop scroll jumps: focus returns with <code>preventScroll</code>.</li>
</ul>
