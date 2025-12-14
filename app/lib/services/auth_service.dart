import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/auth_error_codes.dart';

/// AuthService handles JWT-based authentication for the Flutter app.
/// 
/// Authentication Behavior:
/// - Account deactivated/removed: User is automatically logged out
/// - Permission changes: Token is automatically refreshed
/// - Network errors: Authentication state is preserved
/// - Invalid tokens: User is logged out
class AuthService {
  static const String _baseUrl = 'http://localhost:3000';
  static const String _tokenKey = 'auth_token';
  static const String _userKey = 'user_data';

  // Callback for when user needs to be redirected to login
  static Function()? _onLogoutRequired;

  /// Set callback for when logout navigation is required
  static void setLogoutCallback(Function() callback) {
    _onLogoutRequired = callback;
  }

  /// Check if an error code requires logout
  static bool _shouldLogout(String? errorCode) {
    return AuthErrorCodes.shouldLogout(errorCode);
  }

  /// Login with email and password
  static Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/api/auth/mobile'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'identifier': email,
          'password': password,
        }),
      );

      // Handle different response formats (structured errors vs server errors)
      Map<String, dynamic> data;
      try {
        data = jsonDecode(response.body);
      } catch (e) {
        // If JSON parsing fails, treat as server error
        return {'success': false, 'error': 'Server error occurred'};
      }

      if (response.statusCode == 200 && data['success'] == true) {
        // Save token and user data
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_tokenKey, data['token']);
        await prefs.setString(_userKey, jsonEncode(data['user']));
        
        return {'success': true, 'user': data['user']};
      } else {
        final error = data['error'] ?? 'Login failed';
        final errorCode = data['errorCode'];
        return {'success': false, 'error': error, 'errorCode': errorCode};
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: ${e.toString()}'};
    }
  }

  /// Refresh the current authentication token
  static Future<Map<String, dynamic>> refreshToken() async {
    try {
      final token = await getToken();
      if (token == null) {
        return {'success': false, 'error': 'No token to refresh'};
      }

      final response = await http.post(
        Uri.parse('$_baseUrl/api/auth/mobile/refresh'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      // Handle different response formats (structured errors vs server errors)
      Map<String, dynamic> data;
      try {
        data = jsonDecode(response.body);
      } catch (e) {
        // If JSON parsing fails, treat as server error but don't clear data
        return {'success': false, 'error': 'Server error occurred'};
      }

      if (response.statusCode == 200 && data['success'] == true) {
        // Save new token and user data
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_tokenKey, data['token']);
        await prefs.setString(_userKey, jsonEncode(data['user']));
        
        return {'success': true, 'user': data['user']};
      } else {
        final error = data['error'] ?? 'Token refresh failed';
        final errorCode = data['errorCode'];
        
        // Clear data for account deactivation, removal, or invalid credentials
        if (_shouldLogout(errorCode)) {
          await logout();
        }
        // For other errors (like permission changes), don't clear data
        
        return {'success': false, 'error': error, 'errorCode': errorCode};
      }
    } catch (e) {
      // Network errors shouldn't clear stored data
      return {'success': false, 'error': 'Network error: ${e.toString()}'};
    }
  }

  /// Check if user is logged in and token is valid
  static Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_tokenKey);
    
    if (token == null || token.isEmpty) {
      return false;
    }

    // Just check if we have a token, don't try to refresh automatically
    // The makeAuthenticatedRequest method will handle refresh when needed
    return true;
  }

  /// Validate current token without clearing data on failure
  static Future<bool> validateToken() async {
    final token = await getToken();
    if (token == null) {
      return false;
    }

    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/api/auth/mobile/refresh'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      // Handle different response formats (structured errors vs server errors)
      Map<String, dynamic> data;
      try {
        data = jsonDecode(response.body);
      } catch (e) {
        // If JSON parsing fails, treat as server error
        return false;
      }

      if (response.statusCode == 200 && data['success'] == true) {
        // Save new token and user data
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_tokenKey, data['token']);
        await prefs.setString(_userKey, jsonEncode(data['user']));
        
        return true;
      } else {
        final errorCode = data['errorCode'];
        
        // Clear data for account deactivation, removal, or invalid credentials
        if (_shouldLogout(errorCode)) {
          await logout();
        }
        // For other errors (like permission changes), don't clear data
        
        return false;
      }
    } catch (e) {
      // Network error, don't clear data
      return false;
    }
  }

  /// Get stored auth token
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  /// Get stored user data
  static Future<Map<String, dynamic>?> getUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userJson = prefs.getString(_userKey);
    if (userJson != null) {
      return jsonDecode(userJson);
    }
    return null;
  }

  /// Logout and clear stored data
  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    // Only clear auth-related preferences, keep language preferences
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
    if (_onLogoutRequired != null) {
      _onLogoutRequired!();
    }
  }

  /// Get authorization headers for API requests with automatic token refresh
  static Future<Map<String, String>> getAuthHeaders({bool retryOnFailure = true}) async {
    final token = await getToken();
    
    if (token == null) {
      return {'Content-Type': 'application/json'};
    }

    // First attempt with current token
    final headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };

    // If this is a retry attempt or we don't want to retry, return current headers
    if (!retryOnFailure) {
      return headers;
    }

    return headers;
  }

  /// Make an authenticated API request with automatic token refresh
  static Future<http.Response> makeAuthenticatedRequest({
    required String method,
    required String endpoint,
    Map<String, dynamic>? body,
    int retryCount = 0,
  }) async {
    final headers = await getAuthHeaders(retryOnFailure: retryCount == 0);
    
    http.Response response;
    
    switch (method.toUpperCase()) {
      case 'GET':
        response = await http.get(Uri.parse('$_baseUrl$endpoint'), headers: headers);
        break;
      case 'POST':
        response = await http.post(
          Uri.parse('$_baseUrl$endpoint'),
          headers: headers,
          body: body != null ? jsonEncode(body) : null,
        );
        break;
      default:
        throw ArgumentError('Unsupported HTTP method: $method');
    }

    // If we get a 401 and haven't retried yet, try to refresh token and retry
    if (response.statusCode == 401 && retryCount == 0) {
      // Try to validate/refresh token without clearing data
      final isValid = await validateToken();
      
      if (isValid) {
        // Token was successfully refreshed, retry the request
        return makeAuthenticatedRequest(
          method: method,
          endpoint: endpoint,
          body: body,
          retryCount: 1,
        );
      } else {
        // Token refresh failed, check if it's a logout-worthy failure
        // Parse the response to see if it's an account issue vs permission issue
        try {
          final data = jsonDecode(response.body);
          final errorCode = data['errorCode'];
          
          // Clear data for account deactivation, removal, or invalid credentials
          if (_shouldLogout(errorCode)) {
            await logout();
          }
          // For other errors (like permission changes), don't clear data
        } catch (e) {
          // If we can't parse the error, don't clear data
        }
      }
    }

    return response;
  }
} 