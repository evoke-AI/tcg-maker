/// Centralized error codes for mobile authentication
/// These constants must match the server-side error codes exactly
class AuthErrorCodes {
  // Token-related errors
  static const String missingToken = 'MISSING_TOKEN';
  static const String invalidToken = 'INVALID_TOKEN';
  
  // User-related errors  
  static const String userNotFound = 'USER_NOT_FOUND';
  static const String accountInactive = 'ACCOUNT_INACTIVE';
  
  // Credential-related errors
  static const String missingCredentials = 'MISSING_CREDENTIALS';
  static const String invalidCredentials = 'INVALID_CREDENTIALS';
  
  /// Error codes that require user logout
  static const Set<String> logoutRequiredCodes = {
    accountInactive,
    userNotFound,
    invalidCredentials,
    invalidToken,
    missingToken,
  };
  
  /// Check if an error code requires logout
  static bool shouldLogout(String? errorCode) {
    return errorCode != null && logoutRequiredCodes.contains(errorCode);
  }
} 