/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: 'rgb(var(--bg-base) / <alpha-value>)',
          panel: 'rgb(var(--bg-panel) / <alpha-value>)',
          deep: 'rgb(var(--bg-deep) / <alpha-value>)',
        },
        accent: {
          cyan: 'rgb(var(--accent-cyan) / <alpha-value>)',
          purple: 'rgb(var(--accent-purple) / <alpha-value>)',
        },
        success: '#00ff88',
        warning: '#ffaa00',
        danger: '#ff3355',
        text: {
          primary: 'rgb(var(--text-primary) / <alpha-value>)',
          muted: '#8b94a8',
          dim: '#5a6378',
        },
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        heading: ['Rajdhani', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(0, 212, 255, 0.4)',
        'glow-purple': '0 0 24px rgba(139, 92, 246, 0.5)',
        'glow-success': '0 0 20px rgba(0, 255, 136, 0.5)',
        'glow-danger': '0 0 20px rgba(255, 51, 85, 0.5)',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 12px rgba(0, 212, 255, 0.3)' },
          '50%': { boxShadow: '0 0 24px rgba(0, 212, 255, 0.7)' },
        },
        flashGreen: {
          '0%': { color: '#00ff88', textShadow: '0 0 18px #00ff88' },
          '100%': { color: '#e8e8f0', textShadow: 'none' },
        },
        flashRed: {
          '0%': { color: '#ff3355', textShadow: '0 0 18px #ff3355' },
          '100%': { color: '#e8e8f0', textShadow: 'none' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-4px)' },
          '40%': { transform: 'translateX(4px)' },
          '60%': { transform: 'translateX(-3px)' },
          '80%': { transform: 'translateX(3px)' },
        },
      },
      animation: {
        pulseGlow: 'pulseGlow 2.4s ease-in-out infinite',
        flashGreen: 'flashGreen 1.2s ease-out',
        flashRed: 'flashRed 1.2s ease-out',
        shake: 'shake 0.5s ease-in-out',
      },
    },
  },
  plugins: [],
};
