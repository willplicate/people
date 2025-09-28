/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    colors: {
      // Keep essential colors
      transparent: 'transparent',
      current: 'currentColor',
      inherit: 'inherit',
      black: '#000000',
      white: '#ffffff',

      // New design system colors
      background: '#f0f2f5', // Light blue-gray
      foreground: '#333333', // Dark gray for primary text

      // Custom semantic colors
      card: {
        DEFAULT: '#ffffff',
        foreground: '#333333',
      },
      primary: {
        DEFAULT: '#e05438', // Orange-red
        foreground: '#ffffff',
        50: '#fef7f5',
        100: '#fde8e1',
        400: '#f87553',
        500: '#e05438',
        600: '#c73e28',
        700: '#a32f1e',
      },
      secondary: {
        DEFAULT: '#666666', // Medium gray
        foreground: '#ffffff',
      },
      muted: {
        DEFAULT: '#f8f9fa',
        foreground: '#666666', // Medium gray for secondary text
      },
      accent: {
        DEFAULT: '#e05438',
        foreground: '#ffffff',
      },
      destructive: {
        DEFAULT: '#dc3545',
        foreground: '#ffffff',
      },
      border: '#e1e5e9',
      input: '#e1e5e9',
      ring: '#e05438',

      // Keep some standard colors that components might use
      gray: {
        50: '#f8f9fa',
        100: '#f1f3f4',
        200: '#e1e5e9',
        300: '#ced4da',
        400: '#9aa0a6',
        500: '#666666', // Medium gray
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
      },
      blue: {
        50: '#f0f2f5',
        100: '#e1e5e9',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
      },
      green: {
        50: '#f0fdf4',
        100: '#dcfce7',
        400: '#4ade80',
        500: '#22c55e',
        600: '#16a34a',
      },
      red: {
        50: '#fef2f2',
        500: '#ef4444',
        600: '#dc2626',
      },
      orange: {
        50: '#fef7f5',
        100: '#fde8e1',
        400: '#f87553',
        500: '#e05438',
        600: '#c73e28',
        700: '#a32f1e',
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        serif: ['Source Serif 4', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'metric': ['2rem', { lineHeight: '1.2', fontWeight: '600' }], // 32px for large metrics
        'metric-lg': ['2.5rem', { lineHeight: '1.1', fontWeight: '700' }], // 40px for larger metrics
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      borderRadius: {
        'card': '8px',
      },
      spacing: {
        'card-gap': '16px',
      },
    },
  },
  plugins: [],
}