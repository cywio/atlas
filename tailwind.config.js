const plugin = require('tailwindcss/plugin')

module.exports = {
	mode: 'jit',
	purge: ['./pages/**/*.{js,ts,jsx,tsx}', './lib/components/**/*.{js,ts,jsx,tsx}'],
	darkMode: false, // or 'media' or 'class'
	theme: {
		extend: {},
	},
	variants: {
		extend: {},
	},
	plugins: [
		plugin(function ({ addBase, theme }) {
			addBase({
				h1: { fontSize: theme('fontSize.lg') },
				h2: { fontSize: theme('fontSize.md') },
				p: { fontSize: theme('fontSize.sm') },
			})
		}),
	],
}
