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

      // Mobile-first design system colors based on specifications
      background: '#ffffff', // Light theme background
      foreground: '#333333', // Dark text

      // Custom color scheme from specifications
      primary: {
        DEFAULT: '#C8C8A7', // Primary color
        foreground: '#333333',
        50: '#f7f7f3',
        100: '#ebebdc',
        200: '#d8d8b8',
        300: '#c8c8a7',
        400: '#b8b896',
        500: '#C8C8A7',
        600: '#a8a892',
        700: '#8a8a7a',
        800: '#6c6c62',
        900: '#4e4e4a',
      },
      secondary: {
        DEFAULT: '#F6B6C9', // Secondary color
        foreground: '#333333',
        50: '#fef5f8',
        100: '#fde8ee',
        200: '#fbd1dc',
        300: '#f6b6c9',
        400: '#f19bb6',
        500: '#F6B6C9',
        600: '#e895ad',
        700: '#d97491',
        800: '#ca5375',
        900: '#bb3259',
      },
      tertiary: {
        DEFAULT: '#476C3D', // Third color
        foreground: '#ffffff',
        50: '#f2f7f0',
        100: '#e6efe1',
        200: '#ccdfc3',
        300: '#b3cfa5',
        400: '#99bf87',
        500: '#80af69',
        600: '#669f4b',
        700: '#4d8f2d',
        800: '#476C3D',
        900: '#3a5733',
      },
      accent: {
        DEFAULT: '#BFB4AB', // Accent color
        foreground: '#333333',
        50: '#f9f8f6',
        100: '#f3f0ed',
        200: '#e7e1db',
        300: '#dbd2c9',
        400: '#cfc3b7',
        500: '#BFB4AB',
        600: '#a89d94',
        700: '#91867d',
        800: '#7a6f66',
        900: '#63584f',
      },
      destructive: {
        DEFAULT: '#DF3F40', // Error/Alert red
        foreground: '#ffffff',
        50: '#fef2f2',
        100: '#fde6e6',
        200: '#fbcdcd',
        300: '#f9b4b4',
        400: '#f79b9b',
        500: '#f58282',
        600: '#f36969',
        700: '#f15050',
        800: '#df3f40',
        900: '#c73637',
      },
      border: '#E3E6EA', // Light gray borders
      input: '#E3E6EA',
      ring: '#C8C8A7',
      muted: {
        DEFAULT: '#f8f9fa',
        foreground: '#666666',
      },
      card: {
        DEFAULT: '#ffffff',
        foreground: '#333333',
      },

      // Keep some standard colors that components might use
      gray: {
        50: '#f8f9fa',
        100: '#f1f3f4',
        200: '#E3E6EA', // Border color
        300: '#ced4da',
        400: '#9aa0a6',
        500: '#666666',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
      },
      red: {
        50: '#fef2f2',
        500: '#DF3F40',
        600: '#c73637',
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
        'card': '6px', // Slightly rounded corners as specified
      },
      spacing: {
        'outer-padding': '20px', // Consistent outer padding
        'gutter': '16px', // Gutter spacing between items
        'card-gap': '16px',
      },
    },
  },
  plugins: [],
}