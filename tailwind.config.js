/** @type {import('tailwindcss').Config} */
function withOpacity(varName) {
  return ({ opacityValue }) =>
    opacityValue === undefined ? `rgb(var(${varName}))` : `rgb(var(${varName}) / ${opacityValue})`;
}

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: withOpacity('--color-bg'),
        'surface-subtle': withOpacity('--color-bg-subtle'),
        'surface-emphasis': withOpacity('--color-bg-emphasis'),
        ink: withOpacity('--color-text-emphasis'),
        body: withOpacity('--color-text'),
        dim: withOpacity('--color-text-subtle'),
        line: withOpacity('--color-border'),
        'line-subtle': withOpacity('--color-border-subtle'),
        'line-emphasis': withOpacity('--color-border-emphasis'),
        accent: withOpacity('--color-brand'),
        'accent-emphasis': withOpacity('--color-brand-emphasis'),
        'on-accent': withOpacity('--color-brand-text'),
        spark: withOpacity('--color-spark'),
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        body: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.02em',
      },
    },
  },
  plugins: [],
};
