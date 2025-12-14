import 'dart:convert';
import 'package:http/http.dart' as http;
import 'auth_service.dart';

class ApiService {
  static const String _baseUrl = 'http://192.168.10.183:3000'; // Change this to your server URL

  /// Translate text using the server API with automatic token refresh
  static Future<Map<String, dynamic>> translateText({
    required String text,
    required String targetLanguage,
    String? context,
  }) async {
    try {
      final response = await AuthService.makeAuthenticatedRequest(
        method: 'POST',
        endpoint: '/api/translate',
        body: {
          'text': text,
          'targetLanguage': targetLanguage,
          if (context != null) 'context': context,
        },
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
        return {
          'success': true,
          'translatedText': data['translatedText'],
          'originalText': data['originalText'],
          'targetLanguage': data['targetLanguage'],
        };
      } else {
        return {
          'success': false,
          'error': data['error'] ?? 'Translation failed',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
      };
    }
  }

  /// Check server health
  static Future<bool> checkServerHealth() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/api/health'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 5));

      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
} 