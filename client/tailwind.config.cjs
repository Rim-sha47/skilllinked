module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          dark: '#1D4ED8',
          light: '#60A5FA',
        },
        secondary: { DEFAULT: '#3B82F6' },
        accent:    { DEFAULT: '#06B6D4' },
        success:   '#22C55E',
        warning:   '#F59E0B',
        danger:    '#EF4444',
        dark: { bg: '#0F172A', card: '#1E293B' },
        light: { bg: '#F8FAFC' },
        text: { primary: '#0F172A', secondary: '#64748B' },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        glass:      '0 8px 32px 0 rgba(31,38,135,0.07)',
        'glass-dark': '0 8px 32px 0 rgba(0,0,0,0.3)',
        glow:       '0 0 20px rgba(37,99,235,0.45)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      keyframes: {
        blob: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(20px, -30px) scale(1.08)' },
          '66%': { transform: 'translate(-15px, 15px) scale(0.95)' },
        },
      },
      animation: {
        blob: 'blob 8s ease-in-out infinite',
        'blob-delay': 'blob 8s ease-in-out infinite 2s',
      },
    },
  },
  plugins: [],
};
