/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Horizon - "Breaking Dawn" palette
        horizon: {
          void: "#0F172A",        // Primary background (Slate 900)
          deep: "#0c1322",        // Deeper background
          surface: "#1e293b",     // Card surfaces (Slate 800)
          border: "#334155",      // Borders (Slate 700)
          muted: "#475569",       // Muted elements (Slate 600)
        },
        dawn: {
          amber: "#F59E0B",       // Warm amber (start of gradient)
          orange: "#F97316",      // Orange transition
          pink: "#EC4899",        // Hot pink (end of gradient)
          violet: "#A855F7",      // Electric violet accent
        },
        earth: {
          cyan: "#06B6D4",        // Primary accent - functional buttons
          teal: "#14B8A6",        // Secondary teal
          sky: "#0EA5E9",         // Sky blue
        },
        // Semantic colors
        positive: "#10B981",      // Emerald for positive/income
        negative: "#E11D48",      // Rose for negative (muted crimson)
        warning: "#FBBF24",       // Amber warning
        info: "#06B6D4",          // Cyan info
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "1rem",
        "2xl": "1.5rem",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      backgroundImage: {
        'dawn-gradient': 'linear-gradient(135deg, #F59E0B 0%, #EC4899 100%)',
        'dawn-gradient-vertical': 'linear-gradient(180deg, #F59E0B 0%, #EC4899 100%)',
        'earth-gradient': 'linear-gradient(135deg, #06B6D4 0%, #14B8A6 100%)',
        'void-gradient': 'radial-gradient(ellipse at top, #1e293b 0%, #0F172A 50%, #0c1322 100%)',
        'horizon-glow': 'linear-gradient(180deg, transparent 0%, rgba(245, 158, 11, 0.1) 50%, transparent 100%)',
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.3)',
        'glass-lg': '0 8px 32px rgba(0, 0, 0, 0.4)',
        'glow-amber': '0 0 20px rgba(245, 158, 11, 0.3)',
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.3)',
        'glow-pink': '0 0 20px rgba(236, 72, 153, 0.3)',
        'inner-glow': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: 0.6 },
          "50%": { opacity: 1 },
        },
        "horizon-rise": {
          "0%": { transform: "translateY(10px)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
        "fade-in": {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        "slide-up": {
          "0%": { transform: "translateY(20px)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "horizon-rise": "horizon-rise 0.6s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
        "slide-up": "slide-up 0.5s ease-out",
        "shimmer": "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
