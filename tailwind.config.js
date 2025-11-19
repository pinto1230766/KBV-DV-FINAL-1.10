/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./contexts/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Montserrat', 'sans-serif'],
      },
      colors: {
        background: '#f1f5f9',
        'background-dark': '#0f172a',
        primary: '#3b82f6',
        'primary-dark': '#1e40af',
        'primary-light': '#dbeafe',
        secondary: '#8b5cf6',
        'secondary-dark': '#6d28d9',
        'secondary-light': '#ede9fe',
        accent: '#ec4899',
        'accent-dark': '#be185d',
        'accent-light': '#fce7f3',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        'text-main': '#1f2937',
        'text-main-dark': '#f3f4f6',
        'text-muted': '#6b7280',
        'text-muted-dark': '#9ca3af',
        'border-light': '#e5e7eb',
        'border-dark': '#374151',
        glass: 'rgba(255, 255, 255, 0.3)',
        'glass-dark': 'rgba(30, 41, 59, 0.4)',
        'card-light': '#ffffff',
        'card-dark': '#1f2937',
        'bg-light': '#f9fafb',
        'bg-dark': '#111827',
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideOutRight: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-out-right': 'slideOutRight 0.3s ease-in',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      boxShadow: {
        'inner-sm': 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
