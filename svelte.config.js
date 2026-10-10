import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
export default {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		alias: { $site: 'src/site' },
		// GitHub Pages under /<repo>: set BASE_PATH=/drawer-svelte at build time.
		paths: { base: process.env.BASE_PATH ?? '' }
	}
};
