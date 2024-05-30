import type { Config } from 'tailwindcss';

export default {
	content: ['./app/**/*.{js,jsx,ts,tsx}'],
	theme: {
		colors: {
			transparent: 'transparent',
			white: '#ffffff',
			black: '#000000',
			linen: '#F8F7F3',
			orange: '#EF7850',
			casal: '#2A5462',
			lavender: '#ABA9FC',
			sand: '#FCE1AA',
			peach: '#FEE3C6',
		},
		boxShadow: {
			sm: '2px 2px 0 0 #000000;',
			md: '4px 4px 0 0 #000000;',
			lg: '8px 6px 0 0 #000000;',
			xl: '12px 8px 0 0 #000000;',
		},
		extend: {},
	},
	plugins: [],
} satisfies Config;
