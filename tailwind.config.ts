import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary-container": "#ff6a00",
        "on-primary-fixed-variant": "#7b2f00",
        "inverse-on-surface": "#3d2d26",
        "on-tertiary-fixed": "#001d35",
        "secondary-container": "#454747",
        "primary-fixed": "#ffdbcc",
        "inverse-primary": "#a14000",
        "on-primary-fixed": "#351000",
        "on-secondary-fixed-variant": "#454747",
        "secondary": "#c6c6c7",
        "outline": "#a98a7d",
        "on-surface": "#f8ddd2",
        "error-container": "#93000a",
        "background": "#1d100a",
        "surface-container-lowest": "#170b06",
        "on-primary": "#571f00",
        "on-secondary-container": "#b4b5b5",
        "surface-container-low": "#261812",
        "secondary-fixed-dim": "#c6c6c7",
        "surface-dim": "#1d100a",
        "on-error-container": "#ffdad6",
        "surface-container-high": "#362720",
        "outline-variant": "#5a4136",
        "on-tertiary-fixed-variant": "#00497a",
        "on-tertiary": "#003256",
        "on-background": "#f8ddd2",
        "error": "#ffb4ab",
        "on-surface-variant": "#e2bfb0",
        "tertiary-fixed": "#d0e4ff",
        "primary": "#ffb694",
        "surface-container": "#2b1c16",
        "surface-variant": "#41312a",
        "inverse-surface": "#f8ddd2",
        "surface-bright": "#46362e",
        "on-error": "#690005",
        "surface-container-highest": "#41312a",
        "surface": "#1d100a",
        "tertiary-container": "#009eff",
        "tertiary-fixed-dim": "#9ccaff",
        "on-tertiary-container": "#003357",
        "on-secondary": "#2f3131",
        "on-primary-container": "#571f00",
        "secondary-fixed": "#e2e2e2",
        "primary-fixed-dim": "#ffb694",
        "surface-tint": "#ffb694",
        "tertiary": "#9ccaff",
        "on-secondary-fixed": "#1a1c1c"
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      spacing: {
        "unit": "4px",
        "margin-desktop": "32px",
        "margin-mobile": "16px",
        "max-width": "1440px",
        "gutter": "16px"
      },
      fontFamily: {
        "headline-lg": ["Inter"],
        "body-md": ["Inter"],
        "headline-lg-mobile": ["Inter"],
        "body-lg": ["Inter"],
        "label-md": ["Inter"],
        "mono-sm": ["JetBrains Mono"],
        "display-lg": ["Inter"],
        "title-md": ["Inter"]
      },
      fontSize: {
        "headline-lg": ["32px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "600" }],
        "body-md": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "headline-lg-mobile": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "body-lg": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "label-md": ["12px", { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "500" }],
        "mono-sm": ["12px", { lineHeight: "16px", fontWeight: "400" }],
        "display-lg": ["48px", { lineHeight: "56px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "title-md": ["18px", { lineHeight: "24px", fontWeight: "600" }]
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
};

export default config;
