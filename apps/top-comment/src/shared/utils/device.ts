/**
 * Device detection utilities
 */

/**
 * Get device type based on user agent
 * @returns Device type: 'mobile', 'tablet', or 'desktop'
 */
export function getDeviceType(): string {
  const ua = navigator.userAgent;
  
  // Tablet detection
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  
  // Mobile detection
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  
  // Default to desktop
  return 'desktop';
}
