import { compactText } from "@/lib/utils";

const EARTH_RADIUS_MILES = 3958.8;

export function haversineMiles(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
) {
  const dLat = degreesToRadians(latitudeB - latitudeA);
  const dLon = degreesToRadians(longitudeB - longitudeA);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(degreesToRadians(latitudeA)) *
      Math.cos(degreesToRadians(latitudeB)) *
      Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(a));
}

export function coarsenCoordinate(value: number, step = 0.02) {
  return Math.round(value / step) * step;
}

export function approximateCoordinates(latitude: number, longitude: number) {
  return {
    latitude: coarsenCoordinate(latitude),
    longitude: coarsenCoordinate(longitude),
  };
}

export function approximateLocationLabel(locationText: string, latitude: number, longitude: number) {
  const normalized = compactText(locationText).replace(/\b\d{1,5}\s+/g, "");

  if (normalized && !/\b(st|street|ave|avenue|road|rd|drive|dr|lane|ln|apt|unit)\b/i.test(normalized)) {
    return normalized.length > 40 ? `${normalized.slice(0, 37)}...` : normalized;
  }

  const northSouth = latitude >= 40.75 ? "North" : "South";
  const eastWest = longitude >= -73.98 ? "East" : "West";
  return `${northSouth}${eastWest} local area`;
}

export function formatDistance(distanceMiles: number) {
  if (distanceMiles < 0.2) {
    return "within a few blocks";
  }

  return `${distanceMiles.toFixed(1)} miles`;
}

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180;
}

