/**
 * Centralized error codes for mobile authentication
 * These constants ensure consistency across all authentication endpoints
 */
export const AUTH_ERROR_CODES = {
  // Token-related errors
  MISSING_TOKEN: 'MISSING_TOKEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  
  // User-related errors  
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE',
  
  // Credential-related errors
  MISSING_CREDENTIALS: 'MISSING_CREDENTIALS',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
} as const;

/**
 * Error codes that require user logout on the client side
 */
export const LOGOUT_REQUIRED_CODES = new Set([
  AUTH_ERROR_CODES.ACCOUNT_INACTIVE,
  AUTH_ERROR_CODES.USER_NOT_FOUND,
  AUTH_ERROR_CODES.INVALID_CREDENTIALS,
  AUTH_ERROR_CODES.INVALID_TOKEN,
  AUTH_ERROR_CODES.MISSING_TOKEN,
]);

/**
 * Type for authentication error codes
 */
export type AuthErrorCode = typeof AUTH_ERROR_CODES[keyof typeof AUTH_ERROR_CODES]; 