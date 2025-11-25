/**
 * Get the base URL for API calls.
 * In web builds, API routes are relative (/api/...).
 * In Capacitor builds, API routes point to the hosted web app.
 */
export function getApiBaseUrl(): string {
  // Check if running in Capacitor
  if (typeof window !== 'undefined' && (window as unknown as { Capacitor?: unknown }).Capacitor) {
    // Point to your hosted web app (you'll update this after deploying)
    return process.env.NEXT_PUBLIC_API_URL || 'https://pregame.lol';
  }
  // Web build - use relative URLs
  return '';
}

/**
 * Construct a full API URL
 */
export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}
