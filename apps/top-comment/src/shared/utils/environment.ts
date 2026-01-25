/**
 * Environment detection utilities
 */

/**
 * Get environment information for debugging and analytics
 * @returns Environment info object
 */
export function getEnvironmentInfo() {
  const isVercel = typeof window !== 'undefined' && window.location.hostname?.includes('vercel.app');
  
  return {
    isVercel,
    environment: isVercel ? 'Vercel' : 'Localhost',
    hostname: window.location?.hostname,
    url: window.location?.href,
  };
}
