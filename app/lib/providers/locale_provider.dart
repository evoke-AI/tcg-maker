import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LocaleProvider extends ChangeNotifier {
  Locale? _locale; // null means follow system locale
  static const String _localeKey = 'app_locale';

  Locale? get locale => _locale;

  static const List<Locale> supportedLocales = [
    Locale('en'), // English
    Locale('zh', 'TW'), // Chinese (Traditional)
    Locale('ja'), // Japanese
  ];

  /// Initialize locale from saved preferences or system default
  Future<void> initializeLocale() async {
    final prefs = await SharedPreferences.getInstance();
    final savedLocaleCode = prefs.getString(_localeKey);
    
    if (savedLocaleCode != null) {
      // Handle locale codes with country codes
      final parts = savedLocaleCode.split('_');
      final languageCode = parts[0];
      final countryCode = parts.length > 1 ? parts[1] : null;
      final savedLocale = Locale(languageCode, countryCode);
      
      // Check if the saved locale is supported
      if (supportedLocales.any((locale) => 
          locale.languageCode == savedLocale.languageCode && 
          locale.countryCode == savedLocale.countryCode)) {
        _locale = savedLocale;
      }
    }
    // If no saved locale or invalid locale, _locale remains null (system default)
    
    notifyListeners();
  }

  /// Set a specific locale (null to follow system)
  Future<void> setLocale(Locale? locale) async {
    if (locale != null && !supportedLocales.any((supported) => 
        supported.languageCode == locale.languageCode && 
        supported.countryCode == locale.countryCode)) {
      return;
    }
    
    _locale = locale;
    
    final prefs = await SharedPreferences.getInstance();
    if (locale != null) {
      final localeCode = locale.countryCode != null 
          ? '${locale.languageCode}_${locale.countryCode}'
          : locale.languageCode;
      await prefs.setString(_localeKey, localeCode);
    } else {
      await prefs.remove(_localeKey);
    }
    
    notifyListeners();
  }

  /// Clear locale to follow system default
  Future<void> clearLocale() async {
    await setLocale(null);
  }

  /// Check if currently following system locale
  bool get isFollowingSystem => _locale == null;

  String getLanguageName(String languageCode, [String? countryCode]) {
    switch (languageCode) {
      case 'en':
        return 'English';
      case 'zh':
        return '繁體中文'; // Traditional Chinese
      case 'ja':
        return '日本語'; // Japanese
      default:
        return languageCode.toUpperCase();
    }
  }

  /// Get display name for locale option
  String getLocaleDisplayName(Locale? locale) {
    if (locale == null) {
      return 'System Default';
    }
    return getLanguageName(locale.languageCode, locale.countryCode);
  }
} 