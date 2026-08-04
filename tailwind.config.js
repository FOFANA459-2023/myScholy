/** @type {import('tailwindcss').Config} */

/**
 * Design tokens for MyScholy.
 *
 * The palette is unchanged - `brand` holds the same values as Tailwind's `sky`
 * scale and `gold` the same as `yellow`, which is exactly what the site already
 * used (sky-900/blue-900 navigation fading into yellow-600). Naming them makes
 * the intent explicit and stops off-brand indigo/red creeping back in.
 */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1.25rem", lg: "2rem" },
      screens: { "2xl": "80rem" },
    },
    extend: {
      colors: {
        brand: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
          950: "#082f49",
        },
        gold: {
          50: "#fefce8",
          100: "#fef9c3",
          200: "#fef08a",
          300: "#fde047",
          400: "#facc15",
          500: "#eab308",
          600: "#ca8a04",
          700: "#a16207",
          800: "#854d0e",
          900: "#713f12",
        },
        ink: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },
      },
      backgroundImage: {
        // The signature navy-to-gold wash used by the header and footer.
        "brand-wash": "linear-gradient(to bottom, #1e3a8a 0%, #ca8a04 100%)",
        "brand-diagonal":
          "linear-gradient(to bottom right, #0c4a6e 0%, #1e40af 55%, #eab308 100%)",
        "brand-soft": "linear-gradient(to bottom, #e0f2fe 0%, #ffffff 100%)",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(15 23 42 / 0.04), 0 8px 24px -12px rgb(15 23 42 / 0.18)",
        "card-hover":
          "0 2px 4px 0 rgb(15 23 42 / 0.06), 0 18px 40px -16px rgb(15 23 42 / 0.28)",
        ring: "0 0 0 3px rgb(14 165 233 / 0.35)",
      },
      borderRadius: { xl: "0.875rem", "2xl": "1.125rem" },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "none" },
        },
        // Indeterminate route bar: a short segment that accelerates across the
        // track, rather than a glare sweeping over the content.
        "progress-slide": {
          "0%": { transform: "translateX(-100%) scaleX(0.35)" },
          "55%": { transform: "translateX(30%) scaleX(0.75)" },
          "100%": { transform: "translateX(220%) scaleX(0.35)" },
        },
        // Placeholders breathe instead of reflecting.
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
        // The three dots in LoadingDots hop in sequence.
        "bounce-dot": {
          "0%, 60%, 100%": { transform: "none" },
          "30%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.35s ease-out both",
        "progress-slide": "progress-slide 1.15s cubic-bezier(0.65, 0, 0.35, 1) infinite",
        "pulse-soft": "pulse-soft 1.5s ease-in-out infinite",
        "bounce-dot": "bounce-dot 1.1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
