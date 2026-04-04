import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
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
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        flow: {
          DEFAULT: "hsl(var(--flow-action) / <alpha-value>)",
          dark: "hsl(var(--flow-dark) / <alpha-value>)",
          "dark-secondary": "hsl(var(--flow-dark-secondary) / <alpha-value>)",
          action: "hsl(var(--flow-action) / <alpha-value>)",
          accent: "hsl(var(--flow-accent) / <alpha-value>)",
          interactive: "hsl(var(--flow-interactive) / <alpha-value>)",
          secondary: "hsl(var(--flow-secondary) / <alpha-value>)",
          "secondary-2": "hsl(var(--flow-secondary-2) / <alpha-value>)",
          "secondary-3": "hsl(var(--flow-secondary-3) / <alpha-value>)",
          light: "hsl(var(--flow-light) / <alpha-value>)",
          lighter: "hsl(var(--flow-lighter) / <alpha-value>)",
        },
        glow: {
          primary: "hsl(var(--glow-primary) / <alpha-value>)",
          accent: "hsl(var(--glow-accent) / <alpha-value>)",
          warm: "hsl(var(--glow-warm) / <alpha-value>)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 3s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 4s ease-in-out infinite",
      },
      backgroundImage: {
        "aurora-light": "radial-gradient(ellipse 80% 50% at 50% -20%, hsl(217 91% 55% / 0.08), transparent 70%), radial-gradient(ellipse 60% 40% at 80% 100%, hsl(250 60% 65% / 0.05), transparent 60%)",
        "aurora-dark": "radial-gradient(ellipse 80% 50% at 50% -20%, hsl(217 91% 55% / 0.15), transparent 70%), radial-gradient(ellipse 60% 40% at 80% 100%, hsl(250 60% 65% / 0.1), transparent 60%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
