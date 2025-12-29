import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                emerald: {
                    50: '#ecfdf5',
                    100: '#d1fae5',
                    200: '#a7f3d0',
                    300: '#6ee7b7',
                    400: '#34d399',
                    500: '#10b981', // Medical Green
                    600: '#059669',
                    700: '#047857',
                    800: '#065f46',
                    900: '#064e3b',
                    950: '#022c22',
                },
            },
            fontFamily: {
                sans: ['Poppins', 'sans-serif'],
            },
            animation: {
                'slide-in-right': 'slideInRight 0.3s ease-out',
                'shimmer': 'shimmer 2s linear infinite',
                'shimmer-slow': 'shimmer 3s linear infinite',
            },
            keyframes: {
                slideInRight: {
                    '0%': { transform: 'translateX(100%)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
        function ({ addUtilities }: { addUtilities: any }) {
            addUtilities({
                '.animation-delay-200': {
                    'animation-delay': '0.2s',
                },
                '.animation-delay-400': {
                    'animation-delay': '0.4s',
                },
            })
        },
    ],
};
export default config;
