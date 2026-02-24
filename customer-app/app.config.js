// Expo loads .env from project root. Put EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in .env (do not commit .env).
const mapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

module.exports = ({ config }) => ({
  ...config,
  ios: {
    ...config.ios,
    config: {
      ...config.ios?.config,
      googleMaps: { apiKey: mapsKey },
    },
  },
  android: {
    ...config.android,
    config: {
      ...config.android?.config,
      googleMaps: { apiKey: mapsKey },
    },
  },
});
