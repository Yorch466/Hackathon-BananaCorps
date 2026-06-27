/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        'navy-950': '#000000',
        'navy-900': '#0D1B3E',
        'navy-800': '#162347',
        'navy-700': '#1A2540',
        'navy-600': '#243050',
        accent: '#1DB88A',
        'accent-dark': '#0A5C4A',
        danger: '#EF4444',
        success: '#10B981',
        warning: '#F59E0B',
        'ink-primary': '#FFFFFF',
        'ink-secondary': '#94A3B8',
        'ink-muted': '#4B5563',
        'ink-disabled': '#374151',
        line: '#1A2540',
      },
      fontFamily: {
        sans: ['Inter'],
        bold: ['InterBold'],
        mono: ['JetBrainsMono'],
      },
    },
  },
  plugins: [],
};
