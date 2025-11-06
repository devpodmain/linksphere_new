/**
 * Utility functions for generating map URLs
 */

/**
 * Detects if the current device is iOS
 */
export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

/**
 * Generates a map URL for the given location
 * @param location - The location string (e.g., "56, Rangapillai Street, Puducherry")
 * @returns The appropriate map URL for the platform
 */
export const generateMapUrl = (location: string): string => {
  // Encode the location for URL
  const encodedLocation = encodeURIComponent(location);
  
  if (isIOS()) {
    // Apple Maps URL for iOS devices
    return `https://maps.apple.com/?q=${encodedLocation}`;
  } else {
    // Google Maps URL for other devices
    return `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
  }
};

/**
 * Opens a location in maps in a new tab
 * @param location - The location string
 */
export const openLocationInMaps = (location: string): void => {
  const mapUrl = generateMapUrl(location);
  window.open(mapUrl, '_blank', 'noopener,noreferrer');
};
