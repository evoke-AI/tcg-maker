import 'package:shared_preferences/shared_preferences.dart';

class PreferencesService {
  static const String _lastSelectedLanguageCodeKey = 'last_selected_language_code';

  /// Save the last selected language code (e.g., 'English', 'Spanish')
  static Future<void> saveLastSelectedLanguageCode(String languageCode) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_lastSelectedLanguageCodeKey, languageCode);
  }

  /// Get the last selected language code
  static Future<String?> getLastSelectedLanguageCode() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_lastSelectedLanguageCodeKey);
  }

  /// Clear all preferences
  static Future<void> clearPreferences() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }
} 