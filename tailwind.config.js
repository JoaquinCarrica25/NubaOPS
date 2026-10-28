/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0F1B2A",
        "ink-2": "#4C5D70",
        "ink-3": "#8494A6",
        line: "#E3E8EF",
        canvas: "#F4F6FA",
        surface: "#FFFFFF",
        brand: "#0F2A44",
        "brand-2": "#17395C",
        accent: "#00BCD4",
        "accent-ink": "#00727F",
        "accent-soft": "#E6F8FA",
        ok: "#0EA57A",
        "ok-soft": "#E7F6F1",
        warn: "#D97706",
        "warn-soft": "#FDF3E3",
        bad: "#DC2626",
        "bad-soft": "#FDECEC",
      },
      fontFamily: {
        sans: ["'DM Sans'", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,42,68,0.04), 0 10px 30px -18px rgba(15,42,68,0.35)",
        float: "0 18px 50px -20px rgba(15,42,68,0.35)",
        ring: "0 0 0 1px #E3E8EF",
      },
      borderRadius: {
        xl2: "18px",
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        pop: {
          "0%": { transform: "scale(.97)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        rise: {
          "0%": { transform: "translateY(6px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s infinite",
        pop: "pop .18s ease-out",
        rise: "rise .22s ease-out both",
      },
    },
  },
  plugins: [],
};
