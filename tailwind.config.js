/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // Extended color system
      colors: {
        // Brand colors with refined palette
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Memory level colors - refined and professional
        'memory-new': '#ef4444',
        'memory-new-light': '#fee2e2',
        'memory-new-dark': '#dc2626',
        'memory-familiar': '#f59e0b',
        'memory-familiar-light': '#fef3c7',
        'memory-familiar-dark': '#d97706',
        'memory-learning': '#eab308',
        'memory-learning-light': '#fef9c3',
        'memory-learning-dark': '#ca8a04',
        'memory-mastered': '#22c55e',
        'memory-mastered-light': '#dcfce7',
        'memory-mastered-dark': '#16a34a',
        'memory-archived': '#9ca3af',
        'memory-archived-light': '#f3f4f6',
        'memory-archived-dark': '#6b7280',
      },
      // Extended spacing for consistent rhythm
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      // Custom border radius
      borderRadius: {
        'xl': '0.875rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      // Enhanced shadows for depth
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 4px 16px rgba(0, 0, 0, 0.06)',
        'soft-xl': '0 8px 24px rgba(0, 0, 0, 0.08)',
        'inner-soft': 'inset 0 2px 4px rgba(0, 0, 0, 0.04)',
      },
      // Animation durations
      transitionDuration: {
        '400': '400ms',
      },
      // Typography enhancements
      fontSize: {
        'xxs': '0.625rem',
      },
      // Backdrop blur
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
