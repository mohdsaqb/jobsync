import type { Config } from "tailwindcss";

/**
 * Semantic tokens rather than raw palette steps, so a surface is `bg-surface`
 * and a divider is `border-hairline` wherever they appear. Tailwind's default
 * rounded-xl (12px) and rounded-lg (8px) already match the card and control
 * radii, so no custom radii are defined.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F8FAFC",
        surface: "#FFFFFF",
        ink: "#111827",
        muted: "#475569",
        hairline: "#E5E7EB",
        brand: {
          DEFAULT: "#4F46E5",
          hover: "#4338CA",
          subtle: "#EEF2FF",
        },
        success: "#15803D",
        warning: "#B45309",
        danger: "#DC2626",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        // Used sparingly — raised panels only, never on every card.
        card: "0 1px 2px 0 rgb(16 24 40 / 0.04), 0 1px 3px 0 rgb(16 24 40 / 0.06)",
        panel: "0 4px 16px -2px rgb(16 24 40 / 0.08), 0 2px 6px -2px rgb(16 24 40 / 0.04)",
      },
      maxWidth: {
        workspace: "1360px",
      },
    },
  },
  plugins: [],
};

export default config;
