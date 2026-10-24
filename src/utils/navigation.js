/**
 * Navigation utility for GeoHabari
 * 
 * Resolves WordPress routes vs Ticketing routes in an environment-aware manner.
 * - In local development: links stay relative so navigation does not redirect to production.
 * - In production: WordPress links resolve to PUBLIC_WORDPRESS_URL (default: https://geohabari.com),
 *   while ticketing links stay on the ticketing application or resolve to PUBLIC_TICKETING_URL.
 */

const IS_DEV = import.meta.env.DEV;

/**
 * Returns the resolved URL for WordPress pages (Home, About, Contact, Episodes, etc.)
 * @param {string} path - Relative path such as '/' or '/about'
 * @returns {string} - Resolved URL
 */
export function getWordPressUrl(path = '/') {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // During local development, keep links relative unless an explicit WP dev URL is provided
  if (IS_DEV) {
    const devWpBase = import.meta.env.PUBLIC_WORDPRESS_URL || '';
    if (!devWpBase) return cleanPath;
    return `${devWpBase.replace(/\/$/, '')}${cleanPath}`;
  }

  // In production, default to the WordPress main domain
  const prodWpBase = import.meta.env.PUBLIC_WORDPRESS_URL || 'https://geohabari.com';
  return `${prodWpBase.replace(/\/$/, '')}${cleanPath}`;
}

/**
 * Returns the resolved URL for Ticketing application routes (/events, /events/[slug], etc.)
 * @param {string} path - Relative path such as '/events'
 * @returns {string} - Resolved URL
 */
export function getTicketingUrl(path = '/events') {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // If in local dev or if running within the ticketing application itself, keep relative
  if (IS_DEV) {
    return cleanPath;
  }

  const ticketingBase = import.meta.env.PUBLIC_TICKETING_URL || '';
  if (!ticketingBase) return cleanPath;

  return `${ticketingBase.replace(/\/$/, '')}${cleanPath}`;
}
