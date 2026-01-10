// Utility functions for GT7 Telemetry Pro

import { config, getUserTier } from './config';

// ===========================================
// TIME FORMATTING
// ===========================================

/**
 * Format milliseconds to lap time string (MM:SS.mmm)
 */
export function formatLapTime(ms: number): string {
  if (!ms || ms <= 0) return '--:--.---';

  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = Math.floor(ms % 1000);

  return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

/**
 * Format milliseconds to time delta string (+/-S.mmm)
 */
export function formatTimeDelta(ms: number): string {
  if (ms === 0) return '±0.000';

  const sign = ms > 0 ? '+' : '-';
  const absMs = Math.abs(ms);
  const seconds = Math.floor(absMs / 1000);
  const milliseconds = Math.floor(absMs % 1000);

  return `${sign}${seconds}.${milliseconds.toString().padStart(3, '0')}`;
}

/**
 * Format duration in milliseconds to human readable string
 */
export function formatDuration(ms: number): string {
  if (!ms || ms <= 0) return '0s';

  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Format date to locale string
 */
export function formatDate(timestamp: number, options?: Intl.DateTimeFormatOptions): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  });
}

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
  if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}

// ===========================================
// NUMBER FORMATTING
// ===========================================

/**
 * Format speed with units
 */
export function formatSpeed(speed: number, units: 'metric' | 'imperial' = 'metric'): string {
  if (units === 'imperial') {
    return `${Math.round(speed * 0.621371)} mph`;
  }
  return `${Math.round(speed)} km/h`;
}

/**
 * Format distance with units
 */
export function formatDistance(meters: number, units: 'metric' | 'imperial' = 'metric'): string {
  if (units === 'imperial') {
    const miles = meters * 0.000621371;
    return miles >= 1 ? `${miles.toFixed(1)} mi` : `${Math.round(meters * 3.28084)} ft`;
  }
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

/**
 * Format temperature with units
 */
export function formatTemperature(celsius: number, units: 'metric' | 'imperial' = 'metric'): string {
  if (units === 'imperial') {
    return `${Math.round(celsius * 9/5 + 32)}°F`;
  }
  return `${Math.round(celsius)}°C`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format number with thousands separator
 */
export function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

// ===========================================
// RANKING & POINTS
// ===========================================

/**
 * Get tier color for ranking
 */
export function getTierColor(tier: string): string {
  const tierConfig = config.rankingTiers.find(t => t.name === tier);
  return tierConfig?.color || '#808080';
}

/**
 * Calculate points needed for next tier
 */
export function getPointsToNextTier(points: number): { nextTier: string; pointsNeeded: number } | null {
  const currentTier = getUserTier(points);
  const currentIndex = config.rankingTiers.findIndex(t => t.name === currentTier.name);

  if (currentIndex >= config.rankingTiers.length - 1) {
    return null; // Already at max tier
  }

  const nextTier = config.rankingTiers[currentIndex + 1];
  return {
    nextTier: nextTier.name,
    pointsNeeded: nextTier.minPoints - points,
  };
}

// ===========================================
// VALIDATION
// ===========================================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain a number');
  }

  return { valid: errors.length === 0, errors };
}

// ===========================================
// DATA PROCESSING
// ===========================================

/**
 * Calculate average of an array of numbers
 */
export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate standard deviation
 */
export function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = average(values);
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  return Math.sqrt(average(squareDiffs));
}

/**
 * Find min and max values in array
 */
export function minMax(values: number[]): { min: number; max: number } {
  if (values.length === 0) return { min: 0, max: 0 };
  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

/**
 * Calculate lap consistency (lower is better)
 */
export function calculateConsistency(lapTimes: number[]): number {
  if (lapTimes.length < 2) return 100;
  const avg = average(lapTimes);
  const stdDev = standardDeviation(lapTimes);
  return (stdDev / avg) * 100;
}

/**
 * Smooth data using moving average
 */
export function movingAverage(data: number[], windowSize: number): number[] {
  if (data.length < windowSize) return data;

  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(data.length, i + Math.ceil(windowSize / 2));
    const window = data.slice(start, end);
    result.push(average(window));
  }
  return result;
}

// ===========================================
// COLOR UTILITIES
// ===========================================

/**
 * Generate color based on value (green = good, red = bad)
 */
export function getValueColor(value: number, min: number, max: number, inverted: boolean = false): string {
  const normalized = (value - min) / (max - min);
  const adjusted = inverted ? 1 - normalized : normalized;

  const red = Math.round(255 * (1 - adjusted));
  const green = Math.round(255 * adjusted);

  return `rgb(${red}, ${green}, 0)`;
}

/**
 * Get tire wear color (green = new, red = worn)
 */
export function getTireWearColor(wear: number): string {
  if (wear < 0.3) return '#4caf50'; // Green
  if (wear < 0.6) return '#ff9800'; // Orange
  return '#f44336'; // Red
}

/**
 * Get temperature color (blue = cold, red = hot)
 */
export function getTemperatureColor(temp: number, optimalMin: number, optimalMax: number): string {
  if (temp < optimalMin) return '#2196f3'; // Blue - too cold
  if (temp > optimalMax) return '#f44336'; // Red - too hot
  return '#4caf50'; // Green - optimal
}

// ===========================================
// MISC UTILITIES
// ===========================================

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => { inThrottle = false; }, limit);
    }
  };
}

/**
 * Generate a random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Check if running on server
 */
export function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * Check if running on client
 */
export function isClient(): boolean {
  return typeof window !== 'undefined';
}
