<script lang="ts">
	import Sheet from '$site/demos/Sheet.svelte';
	import Snap from '$site/demos/Snap.svelte';
	import Floating from '$site/demos/Floating.svelte';
	import Side from '$site/demos/Side.svelte';
	import Nested from '$site/demos/Nested.svelte';
	import Steps from '$site/demos/Steps.svelte';
	import NonModal from '$site/demos/NonModal.svelte';
	import Scale from '$site/demos/Scale.svelte';
	import Form from '$site/demos/Form.svelte';
	import Theme from '$site/demos/Theme.svelte';
</script>

<svelte:head><title>Examples - drawer-svelte</title></svelte:head>

<h1>Examples</h1>
<p class="lead">Open these on a phone to feel the gestures. The source for each lives in <code>src/site/demos</code>.</p>

<h2>Sheets</h2>
<div class="demo-cards"><Sheet card /><Snap card /><Form card /><Scale card /></div>
<h2>Pickers</h2>
<div class="demo-cards"><Floating card /><Nested card /><Steps card /></div>
<h2>Panels</h2>
<div class="demo-cards"><Side card direction="right" /><Side card direction="left" /><Side card direction="top" /></div>
<h2>Non-modal</h2>
<div class="demo-cards"><NonModal card /></div>
<h2>Theme playground</h2>
<Theme />
