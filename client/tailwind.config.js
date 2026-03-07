module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        primary: '#2563EB',
        'primary-hover': '#1D4ED8',
        success: '#16A34A',
        danger: '#DC2626',
        warning: '#D97706',
        'text-primary': '#0F172A',
        'text-secondary': '#64748B',
        border: '#E5E7EB',
        surface: '#F8FAFC',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08)',
      }
    },
  },
  plugins: [],
};

