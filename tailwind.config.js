/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neon-cyan': '#00f0ff',
        'neon-pink': '#ff0080',
        'neon-purple': '#bd00ff',
        'neon-blue': '#0066ff',
        'neon-green': '#00ff88',
        'cyber-dark': '#0a0118',
        'cyber-medium': '#1a0a3e',
      },
      fontFamily: {
        'display': ['Orbitron', 'sans-serif'],
        'body': ['Rajdhani', 'sans-serif'],
        'mono': ['Share Tech Mono', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 240, 255, 0.5)',
        'glow-cyan/20': '0 0 10px rgba(0, 240, 255, 0.2)',
        'glow-cyan/80': '0 0 30px rgba(0, 240, 255, 0.8)',
        'glow-magenta': '0 0 20px rgba(255, 0, 128, 0.5)',
        'glow-magenta/20': '0 0 10px rgba(255, 0, 128, 0.2)',
        'glow-magenta/80': '0 0 30px rgba(255, 0, 128, 0.8)',
        'glow-purple': '0 0 20px rgba(189, 0, 255, 0.5)',
        'glow-purple/20': '0 0 10px rgba(189, 0, 255, 0.2)',
        'glow-yellow': '0 0 20px rgba(234, 179, 8, 0.5)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'holographic': 'holographic-shift 3s linear infinite',
        'particle-drift': 'particle-drift 20s linear infinite',
        'scan': 'scan 8s linear infinite',
        'border-flow': 'border-flow 3s linear infinite',
      },
      keyframes: {
        'border-flow': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
      },
      backdropBlur: {
        'glass': '12px',
      },
    },
  },
  plugins: [],
}
