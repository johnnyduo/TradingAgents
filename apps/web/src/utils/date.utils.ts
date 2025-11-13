/**
 * Get current date and time with timezone information
 * Useful for agents to understand market hours and data freshness
 */
export function getCurrentDateTimeWithTimezone(): string {
  const now = new Date();
  
  // Format: Wednesday, November 13, 2024 at 3:45 PM EST (UTC-5)
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/New_York',
  };
  
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
    timeZone: 'America/New_York',
  };
  
  const datePart = now.toLocaleDateString('en-US', dateOptions);
  const timePart = now.toLocaleTimeString('en-US', timeOptions);
  
  // Get UTC offset
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    timeZoneName: 'longOffset',
  });
  const parts = formatter.formatToParts(now);
  const offsetPart = parts.find(p => p.type === 'timeZoneName')?.value || '';
  
  return `${datePart} at ${timePart} (${offsetPart})`;
}

/**
 * Get simple date string for API calls (YYYY-MM-DD)
 */
export function getDateString(date: Date = new Date()): string {
  // Use US Eastern time for market consistency
  return date.toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); // en-CA gives YYYY-MM-DD format
}

/**
 * Check if US market is currently open
 */
export function isMarketOpen(): boolean {
  const now = new Date();
  const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  
  const day = estTime.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = estTime.getHours();
  const minute = estTime.getMinutes();
  const totalMinutes = hour * 60 + minute;
  
  // Market closed on weekends
  if (day === 0 || day === 6) {
    return false;
  }
  
  // Market hours: 9:30 AM - 4:00 PM EST
  const marketOpen = 9 * 60 + 30; // 9:30 AM
  const marketClose = 16 * 60; // 4:00 PM
  
  return totalMinutes >= marketOpen && totalMinutes < marketClose;
}

/**
 * Get market status message
 */
export function getMarketStatus(): string {
  if (isMarketOpen()) {
    return 'US markets are OPEN - data is live and reflects current trading activity';
  }
  
  const now = new Date();
  const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = estTime.getDay();
  
  if (day === 0 || day === 6) {
    return 'US markets are CLOSED (weekend) - using most recent trading day data';
  }
  
  const hour = estTime.getHours();
  if (hour < 9 || (hour === 9 && estTime.getMinutes() < 30)) {
    return 'US markets are CLOSED (pre-market) - using previous close data';
  }
  
  return 'US markets are CLOSED (after-hours) - using today\'s close data';
}
