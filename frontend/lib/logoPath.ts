/**
 * The "JS" monogram as outlined vector paths (Arial Bold, cap-height centered
 * in a 40x40 box).
 *
 * These are outlines rather than SVG <text> on purpose: the favicon and apple
 * icon are rasterized server-side by next/og (satori), which only ships a
 * regular-weight font — `fontWeight: 800` there renders thin, not bold. Paths
 * render identically everywhere with no font dependency at all.
 */
export const LOGO_JS_PATH =
  "M14.13 12.13H17.3V22.09Q17.3 24.05 16.95 25.1Q16.49 26.48 15.28 27.31Q14.06 28.14 12.08 28.14Q9.75 28.14 8.49 26.84Q7.23 25.53 7.22 23.01L10.22 22.66Q10.27 24.02 10.62 24.58Q11.13 25.42 12.18 25.42Q13.25 25.42 13.69 24.82Q14.13 24.21 14.13 22.3Z M19.28 22.75 22.37 22.45Q22.65 24.01 23.5 24.74Q24.36 25.47 25.81 25.47Q27.34 25.47 28.12 24.82Q28.9 24.17 28.9 23.3Q28.9 22.74 28.57 22.35Q28.25 21.96 27.43 21.67Q26.87 21.47 24.88 20.98Q22.33 20.34 21.3 19.42Q19.85 18.12 19.85 16.25Q19.85 15.05 20.53 14Q21.21 12.95 22.49 12.41Q23.78 11.86 25.59 11.86Q28.56 11.86 30.06 13.16Q31.55 14.46 31.63 16.63L28.45 16.77Q28.25 15.55 27.57 15.02Q26.9 14.49 25.56 14.49Q24.17 14.49 23.39 15.06Q22.89 15.42 22.89 16.04Q22.89 16.59 23.36 16.99Q23.96 17.5 26.28 18.04Q28.6 18.59 29.71 19.18Q30.82 19.76 31.45 20.78Q32.08 21.79 32.08 23.29Q32.08 24.64 31.33 25.82Q30.58 27 29.2 27.58Q27.83 28.15 25.77 28.15Q22.79 28.15 21.19 26.77Q19.59 25.39 19.28 22.75Z";

/** Badge background — matches the app's own bg-zinc-950 body color. */
export const LOGO_BG = "#09090b";
