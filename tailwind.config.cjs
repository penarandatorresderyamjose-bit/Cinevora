module.exports = {
  content: ['./index.html','./src/**/*.{ts,tsx}'],
  theme: { extend: {
    colors: { canvas: '#090a10', panel: '#151622', accent: '#ee4d72', muted: '#a4a4b4' },
    fontFamily: { sans: ['Inter','ui-sans-serif','system-ui','-apple-system','sans-serif'] }
  } }, plugins: []
};
