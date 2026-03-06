import * as Location from 'expo-location';

interface GeocodingResult {
  city: string | null;
  country: string | null;
  displayName: string;
}

/**
 * Reverse geocode coordinates to get city and country.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodingResult> {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });

    if (results.length === 0) {
      return createFallbackResult();
    }

    const result = results[0];
    const city = result.city || result.subregion || result.region || null;
    const country = result.country || null;

    const displayName = formatDisplayName(city, country);

    return {
      city,
      country,
      displayName,
    };
  } catch (error) {
    console.error('[Geocoding] Reverse geocode failed:', error);
    return createFallbackResult();
  }
}

/**
 * Generate an auto-name for a series based on location.
 */
export async function generateSeriesName(
  latitude: number,
  longitude: number
): Promise<{ name: string; city: string | null; country: string | null }> {
  const geocode = await reverseGeocode(latitude, longitude);
  const date = formatDate(new Date());

  return {
    name: `${geocode.displayName} - ${date}`,
    city: geocode.city,
    country: geocode.country,
  };
}

function formatDisplayName(city: string | null, country: string | null): string {
  if (city && country) {
    return `${city}, ${country}`;
  }
  if (city) {
    return city;
  }
  if (country) {
    return country;
  }
  return 'Tracking';
}

function createFallbackResult(): GeocodingResult {
  return {
    city: null,
    country: null,
    displayName: 'Tracking',
  };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
