// Ergänzt app.json. EXPO_BASE_URL setzt den Unterordner für die Web-Version,
// z. B. "/DaySell" für GitHub Pages. Ohne Angabe läuft sie im Hauptverzeichnis (Netlify).
module.exports = ({ config }) => ({
  ...config,
  experiments: { ...(config.experiments || {}), baseUrl: process.env.EXPO_BASE_URL || '' },
});
