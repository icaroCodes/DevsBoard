/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "accentaccent-4": "var(--accentaccent-4)",
        "dividersdivider-1": "var(--dividersdivider-1)",
        textcaptions: "var(--textcaptions)",
        "texton-accent-1": "var(--texton-accent-1)",
      },
      fontFamily: {
        captions: "var(--captions-font-family)",
        link: "var(--link-font-family)",
      },
    },
  },
  plugins: [],
};