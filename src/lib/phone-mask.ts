/**
 * Brazilian phone number formatting utilities
 * Supports both landline (10 digits) and mobile (11 digits) formats
 */

/**
 * Extracts only numeric characters from a string
 */
export function extractNumbers(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Formats a phone number with Brazilian mask
 * Mobile: (99) 99999-9999 (11 digits)
 * Landline: (99) 9999-9999 (10 digits)
 */
export function formatPhoneNumber(value: string): string {
  const numbers = extractNumbers(value);
  
  if (numbers.length === 0) return '';
  
  // Format based on length
  if (numbers.length <= 2) {
    return `(${numbers}`;
  }
  
  if (numbers.length <= 6) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  }
  
  if (numbers.length <= 10) {
    // Landline format: (99) 9999-9999
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  }
  
  // Mobile format: (99) 99999-9999
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
}

/**
 * Validates a Brazilian phone number
 * Returns true if valid, false otherwise
 */
export function isValidPhoneNumber(value: string): boolean {
  const numbers = extractNumbers(value);
  
  // Empty is valid (optional field)
  if (numbers.length === 0) return true;
  
  // Must be 10 (landline) or 11 (mobile) digits
  if (numbers.length !== 10 && numbers.length !== 11) {
    return false;
  }
  
  // DDD must be between 11 and 99
  const ddd = parseInt(numbers.slice(0, 2), 10);
  if (ddd < 11 || ddd > 99) {
    return false;
  }
  
  // Mobile numbers must start with 9 after DDD
  if (numbers.length === 11 && numbers[2] !== '9') {
    return false;
  }
  
  return true;
}

/**
 * Gets validation error message for phone number
 */
export function getPhoneValidationError(value: string): string | null {
  const numbers = extractNumbers(value);
  
  if (numbers.length === 0) return null;
  
  if (numbers.length < 10) {
    return 'Número de telefone incompleto. Informe DDD + número.';
  }
  
  if (numbers.length > 11) {
    return 'Número de telefone muito longo.';
  }
  
  const ddd = parseInt(numbers.slice(0, 2), 10);
  if (ddd < 11 || ddd > 99) {
    return 'DDD inválido. Informe um DDD válido (11-99).';
  }
  
  if (numbers.length === 11 && numbers[2] !== '9') {
    return 'Celulares devem começar com 9 após o DDD.';
  }
  
  return null;
}
