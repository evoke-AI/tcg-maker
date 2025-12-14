import '../l10n/app_localizations.dart';
import 'api_service.dart';

class TranslationService {
  /// Translates text using the server API
  static Future<String> translateText(String text, String targetLanguage, {String? context}) async {
    if (text.isEmpty) {
      throw ArgumentError('Text cannot be empty');
    }

    if (!isValidForTranslation(text)) {
      throw ArgumentError('Text is not valid for translation');
    }

    final result = await ApiService.translateText(
      text: text,
      targetLanguage: targetLanguage,
      context: context,
    );

    if (result['success'] == true) {
      return result['translatedText'] as String;
    } else {
      throw Exception(result['error'] ?? 'Translation failed');
    }
  }

  /// Validates if text is suitable for translation
  static bool isValidForTranslation(String text) {
    return text.trim().isNotEmpty && text.length <= 5000;
  }

  /// Gets supported languages using localized names
  static List<String> getSupportedLanguages(AppLocalizations l10n) {
    return [
      l10n.languageEnglish,
      l10n.languageSpanish,
      l10n.languageFrench,
      l10n.languageGerman,
      l10n.languageChinese,
      l10n.languageChineseTraditional,
      l10n.languageJapanese,
      l10n.languageKorean,
    ];
  }

  /// Maps localized language names to API language codes
  static String getLanguageCode(String localizedName, AppLocalizations l10n) {
    final languageMap = {
      l10n.languageEnglish: 'English',
      l10n.languageSpanish: 'Spanish',
      l10n.languageFrench: 'French',
      l10n.languageGerman: 'German',
      l10n.languageChinese: 'Simplified Chinese',
      l10n.languageChineseTraditional: 'Traditional Chinese',
      l10n.languageJapanese: 'Japanese',
      l10n.languageKorean: 'Korean',
    };
    
    return languageMap[localizedName] ?? 'English';
  }

  /// Gets supported language codes (for saving preferences)
  static List<String> getSupportedLanguageCodes() {
    return [
      'English',
      'Spanish',
      'French',
      'German',
      'Simplified Chinese',
      'Traditional Chinese',
      'Japanese',
      'Korean',
    ];
  }

  /// Maps language codes to localized names
  static String getLocalizedLanguageName(String languageCode, AppLocalizations l10n) {
    final codeToLocalizedMap = {
      'English': l10n.languageEnglish,
      'Spanish': l10n.languageSpanish,
      'French': l10n.languageFrench,
      'German': l10n.languageGerman,
      'Simplified Chinese': l10n.languageChinese,
      'Traditional Chinese': l10n.languageChineseTraditional,
      'Japanese': l10n.languageJapanese,
      'Korean': l10n.languageKorean,
    };
    
    return codeToLocalizedMap[languageCode] ?? l10n.languageEnglish;
  }
} 