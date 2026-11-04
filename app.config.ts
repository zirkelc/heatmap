import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * The Google Maps key is not in the repository. Local builds read it from `.env.local`,
 * EAS builds from the EAS environment variable with the same name.
 */
const googleMapsApiKey = process.env.GOOGLE_MAPS_IOS_API_KEY;

if (!googleMapsApiKey) {
  if (process.env.EAS_BUILD === 'true') {
    throw new Error('GOOGLE_MAPS_IOS_API_KEY is not set for this EAS build');
  }
  console.warn('GOOGLE_MAPS_IOS_API_KEY is not set: the map will not load');
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'Heatmap',
  slug: config.slug ?? 'heatmap',
  ios: {
    ...config.ios,
    config: {
      ...config.ios?.config,
      googleMapsApiKey,
    },
  },
});
