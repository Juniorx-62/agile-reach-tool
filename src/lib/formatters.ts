/**
 * Centralized formatting utilities for the application
 * Ensures consistent data display across all components
 */

/**
 * Formats hours with safe fallback for invalid values
 * Returns number with max 1 decimal place
 */
export function formatHours(hours: number | null | undefined): number {
  const value = Number(hours);
  
  // Handle invalid values
  if (!isFinite(value) || isNaN(value) || value < 0 || value >= 100000) {
    return 0;
  }
  
  // Return integer if whole number, otherwise 1 decimal
  return Number.isInteger(value) ? value : Number(value.toFixed(1));
}

/**
 * Formats hours as display string (e.g., "12.5h")
 */
export function formatHoursDisplay(hours: number | null | undefined): string {
  const formatted = formatHours(hours);
  return `${formatted}h`;
}

/**
 * Formats large numbers with thousand separators
 */
export function formatNumber(num: number | null | undefined): string {
  const value = Number(num);
  
  if (!isFinite(value) || isNaN(value)) {
    return '0';
  }
  
  return new Intl.NumberFormat('pt-BR').format(value);
}

/**
 * Formats percentage with max 1 decimal place
 */
export function formatPercentage(value: number | null | undefined): number {
  const num = Number(value);
  
  if (!isFinite(num) || isNaN(num) || num < 0) {
    return 0;
  }
  
  if (num > 100) {
    return 100;
  }
  
  return Number.isInteger(num) ? num : Number(num.toFixed(1));
}

/**
 * Formats percentage as display string (e.g., "85.5%")
 */
export function formatPercentageDisplay(value: number | null | undefined): string {
  return `${formatPercentage(value)}%`;
}

/**
 * Sanitizes and validates estimated hours from import
 */
export function sanitizeEstimatedHours(value: any): number {
  // Handle string input
  if (typeof value === 'string') {
    // Remove 'h' suffix and whitespace
    const cleaned = value.replace(/h$/i, '').trim();
    // Replace comma with dot for decimal
    const normalized = cleaned.replace(',', '.');
    return formatHours(parseFloat(normalized));
  }
  
  return formatHours(value);
}

/**
 * Validates if a value is a safe number for display
 */
export function isSafeNumber(value: any): boolean {
  const num = Number(value);
  return isFinite(num) && !isNaN(num) && num >= 0 && num < 100000;
}

/**
 * Truncates text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Formats date to localized string
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return '-';
  }
  
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Formats date with time
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '-';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return '-';
  }
  
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
