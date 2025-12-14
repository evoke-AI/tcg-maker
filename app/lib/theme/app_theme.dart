import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  // Primary colors from evoke AI branding
  static const Color primary = Color(0xFF174F7F);
  static const Color darkGray = Color(0xFF1F2937);
  static const Color mediumGray = Color(0xFF6B7280);
  static const Color lightGray = Color(0xFF9CA3AF);
  static const Color borderGray = Color(0xFFE5E7EB);
  static const Color backgroundGray = Color(0xFFF9FAFB);
  static const Color lightBlue = Color(0xFFF0F9FF);
  
  // System colors
  static const Color white = Colors.white;
  static const Color black12 = Colors.black12;
  
  // Text colors
  static const Color textSecondary = mediumGray;
}

class AppTheme {
  // Font families for different languages
  static const String _englishFont = 'Inter';
  static const String _chineseFont = 'Noto Sans TC'; // Traditional Chinese
  static const String _japaneseFont = 'Noto Sans JP'; // Japanese
  
  // Track which fonts have been preloaded
  static final Set<String> _preloadedFonts = <String>{};
  static bool _fontsInitialized = false;

  /// Preload fonts for better performance and reliability
  static Future<void> preloadFonts() async {
    if (_fontsInitialized) return;
    
    try {
      // Preload commonly used fonts
      await Future.wait([
        GoogleFonts.pendingFonts([
          GoogleFonts.inter(),
          GoogleFonts.notoSansTc(),
          GoogleFonts.notoSansJp(),
          GoogleFonts.notoSansSc(),
        ]),
      ]);
      
      _preloadedFonts.addAll([
        'Inter',
        'Noto Sans TC',
        'Noto Sans JP', 
        'Noto Sans SC',
      ]);
      
      debugPrint('Google Fonts preloaded successfully');
    } catch (e) {
      debugPrint('Failed to preload Google Fonts: $e');
    }
    
    _fontsInitialized = true;
  }

  // Get appropriate font family based on locale
  static String _getFontFamily(Locale? locale) {
    if (locale == null) return _englishFont;
    
    switch (locale.languageCode) {
      case 'zh':
        // Check for Traditional vs Simplified Chinese
        if (locale.countryCode == 'TW' || locale.countryCode == 'HK' || locale.countryCode == 'MO') {
          return _chineseFont; // Traditional Chinese
        }
        return 'Noto Sans SC'; // Simplified Chinese
      case 'ja':
        return _japaneseFont;
      case 'ko':
        return 'Noto Sans KR';
      default:
        return _englishFont;
    }
  }

  // Create text theme with language-appropriate fonts
  static TextTheme _getTextTheme(Locale? locale) {
    final fontFamily = _getFontFamily(locale);
    
    try {
      // Try to get Google Font first
      TextTheme baseTheme;
      switch (fontFamily) {
        case 'Inter':
          baseTheme = GoogleFonts.interTextTheme();
          break;
        case 'Noto Sans TC':
          baseTheme = GoogleFonts.notoSansTcTextTheme();
          break;
        case 'Noto Sans JP':
          baseTheme = GoogleFonts.notoSansJpTextTheme();
          break;
        case 'Noto Sans SC':
          baseTheme = GoogleFonts.notoSansScTextTheme();
          break;
        case 'Noto Sans KR':
          baseTheme = GoogleFonts.notoSansKrTextTheme();
          break;
        default:
          baseTheme = GoogleFonts.interTextTheme();
      }
      
      // Apply fallback fonts to each text style
      return _applyFontFallbacks(baseTheme, locale);
      
    } catch (e) {
      // If Google Fonts fails, return fallback theme with font stack
      debugPrint('Google Fonts failed to load, using fallback: $e');
      return _createFallbackTextTheme(locale);
    }
  }

  // Apply font fallbacks to text theme
  static TextTheme _applyFontFallbacks(TextTheme baseTheme, Locale? locale) {
    final fallbacks = _getFontFallbacks(locale);
    
    return baseTheme.copyWith(
      displayLarge: baseTheme.displayLarge?.copyWith(fontFamilyFallback: fallbacks),
      displayMedium: baseTheme.displayMedium?.copyWith(fontFamilyFallback: fallbacks),
      displaySmall: baseTheme.displaySmall?.copyWith(fontFamilyFallback: fallbacks),
      headlineLarge: baseTheme.headlineLarge?.copyWith(fontFamilyFallback: fallbacks),
      headlineMedium: baseTheme.headlineMedium?.copyWith(fontFamilyFallback: fallbacks),
      headlineSmall: baseTheme.headlineSmall?.copyWith(fontFamilyFallback: fallbacks),
      titleLarge: baseTheme.titleLarge?.copyWith(fontFamilyFallback: fallbacks),
      titleMedium: baseTheme.titleMedium?.copyWith(fontFamilyFallback: fallbacks),
      titleSmall: baseTheme.titleSmall?.copyWith(fontFamilyFallback: fallbacks),
      bodyLarge: baseTheme.bodyLarge?.copyWith(fontFamilyFallback: fallbacks),
      bodyMedium: baseTheme.bodyMedium?.copyWith(fontFamilyFallback: fallbacks),
      bodySmall: baseTheme.bodySmall?.copyWith(fontFamilyFallback: fallbacks),
      labelLarge: baseTheme.labelLarge?.copyWith(fontFamilyFallback: fallbacks),
      labelMedium: baseTheme.labelMedium?.copyWith(fontFamilyFallback: fallbacks),
      labelSmall: baseTheme.labelSmall?.copyWith(fontFamilyFallback: fallbacks),
    );
  }

  // Get font fallbacks based on locale
  static List<String> _getFontFallbacks(Locale? locale) {
    if (locale == null) {
      return ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'];
    }
    
    switch (locale.languageCode) {
      case 'zh':
        return [
          'Noto Sans TC',
          'Noto Sans SC', 
          'PingFang TC',
          'PingFang SC',
          'Microsoft YaHei',
          'SimHei',
          'system-ui',
          'sans-serif'
        ];
      case 'ja':
        return [
          'Noto Sans JP',
          'Hiragino Kaku Gothic ProN',
          'Hiragino Sans',
          'Yu Gothic',
          'Meiryo',
          'system-ui',
          'sans-serif'
        ];
      case 'ko':
        return [
          'Noto Sans KR',
          'Malgun Gothic',
          'Apple SD Gothic Neo',
          'system-ui',
          'sans-serif'
        ];
      default:
        return [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif'
        ];
    }
  }

  // Create fallback text theme with comprehensive font stack
  static TextTheme _createFallbackTextTheme(Locale? locale) {
    final fallbacks = _getFontFallbacks(locale);
    final primaryFont = fallbacks.first;
    
    return TextTheme(
      displayLarge: TextStyle(fontFamily: primaryFont, fontFamilyFallback: fallbacks, fontWeight: FontWeight.w400),
      displayMedium: TextStyle(fontFamily: primaryFont, fontFamilyFallback: fallbacks, fontWeight: FontWeight.w400),
      displaySmall: TextStyle(fontFamily: primaryFont, fontFamilyFallback: fallbacks, fontWeight: FontWeight.w400),
      headlineLarge: TextStyle(fontFamily: primaryFont, fontFamilyFallback: fallbacks, fontWeight: FontWeight.w400),
      headlineMedium: TextStyle(fontFamily: primaryFont, fontFamilyFallback: fallbacks, fontWeight: FontWeight.w400),
      headlineSmall: TextStyle(fontFamily: primaryFont, fontFamilyFallback: fallbacks, fontWeight: FontWeight.w400),
      titleLarge: TextStyle(fontFamily: primaryFont, fontFamilyFallback: fallbacks, fontWeight: FontWeight.w500),
      titleMedium: TextStyle(fontFamily: primaryFont, fontFamilyFallback: fallbacks, fontWeight: FontWeight.w500),
      titleSmall: TextStyle(fontFamily: primaryFont, fontFamilyFallback: fallbacks, fontWeight: FontWeight.w500),
      bodyLarge: TextStyle(fontFamily: primaryFont, fontFamilyFallback: fallbacks, fontWeight: FontWeight.w400),
      bodyMedium: TextStyle(fontFamily: primaryFont, fontFamilyFallback: fallbacks, fontWeight: FontWeight.w400),
      bodySmall: TextStyle(fontFamily: primaryFont, fontFamilyFallback: fallbacks, fontWeight: FontWeight.w400),
      labelLarge: TextStyle(fontFamily: primaryFont, fontFamilyFallback: fallbacks, fontWeight: FontWeight.w500),
      labelMedium: TextStyle(fontFamily: primaryFont, fontFamilyFallback: fallbacks, fontWeight: FontWeight.w500),
      labelSmall: TextStyle(fontFamily: primaryFont, fontFamilyFallback: fallbacks, fontWeight: FontWeight.w500),
    );
  }

  static ThemeData getLightTheme(Locale? locale) {
    return ThemeData(
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primary,
        brightness: Brightness.light,
      ),
      textTheme: _getTextTheme(locale),
      useMaterial3: true,
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.white,
        foregroundColor: AppColors.darkGray,
        elevation: 1,
        shadowColor: AppColors.black12,
        titleTextStyle: _getSafeTextStyle(
          locale: locale,
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: AppColors.darkGray,
        ),
      ),
    );
  }

  // Backward compatibility
  static ThemeData get lightTheme => getLightTheme(null);

  static TextStyle _getSafeTextStyle({
    Locale? locale,
    double? fontSize,
    FontWeight? fontWeight,
    Color? color,
  }) {
    final fontFamily = _getFontFamily(locale);
    final fallbacks = _getFontFallbacks(locale);
    
    try {
      // Try to get Google Font first
      TextStyle style;
      switch (fontFamily) {
        case 'Inter':
          style = GoogleFonts.inter(
            fontSize: fontSize,
            fontWeight: fontWeight,
            color: color,
          );
          break;
        case 'Noto Sans TC':
          style = GoogleFonts.notoSansTc(
            fontSize: fontSize,
            fontWeight: fontWeight,
            color: color,
          );
          break;
        case 'Noto Sans JP':
          style = GoogleFonts.notoSansJp(
            fontSize: fontSize,
            fontWeight: fontWeight,
            color: color,
          );
          break;
        case 'Noto Sans SC':
          style = GoogleFonts.notoSansSc(
            fontSize: fontSize,
            fontWeight: fontWeight,
            color: color,
          );
          break;
        case 'Noto Sans KR':
          style = GoogleFonts.notoSansKr(
            fontSize: fontSize,
            fontWeight: fontWeight,
            color: color,
          );
          break;
        default:
          style = GoogleFonts.inter(
            fontSize: fontSize,
            fontWeight: fontWeight,
            color: color,
          );
      }
      
      // Add fallback fonts
      return style.copyWith(fontFamilyFallback: fallbacks);
      
    } catch (e) {
      debugPrint('Failed to load Google Font $fontFamily, using fallback: $e');
      return TextStyle(
        fontFamily: fallbacks.first,
        fontFamilyFallback: fallbacks,
        fontSize: fontSize,
        fontWeight: fontWeight,
        color: color,
      );
    }
  }
}

class AppTextStyles {
  static TextStyle heroTitle([Locale? locale]) => AppTheme._getSafeTextStyle(
    locale: locale,
    fontSize: 32,
    fontWeight: FontWeight.bold,
    color: AppColors.white,
  );

  static TextStyle heroSubtitle([Locale? locale]) => AppTheme._getSafeTextStyle(
    locale: locale,
    fontSize: 16,
    color: AppColors.white.withValues(alpha: 0.9),
  );

  static TextStyle sectionTitle([Locale? locale]) => AppTheme._getSafeTextStyle(
    locale: locale,
    fontSize: 24,
    fontWeight: FontWeight.bold,
    color: AppColors.darkGray,
  );

  static TextStyle cardTitle([Locale? locale]) => AppTheme._getSafeTextStyle(
    locale: locale,
    fontSize: 18,
    fontWeight: FontWeight.w600,
    color: AppColors.darkGray,
  );

  static TextStyle buttonText([Locale? locale]) => AppTheme._getSafeTextStyle(
    locale: locale,
    fontSize: 16,
    fontWeight: FontWeight.w600,
  );

  static TextStyle bodyText([Locale? locale]) => AppTheme._getSafeTextStyle(
    locale: locale,
    fontSize: 16,
    color: AppColors.darkGray,
  );

  static TextStyle captionText([Locale? locale]) => AppTheme._getSafeTextStyle(
    locale: locale,
    fontSize: 14,
    color: AppColors.mediumGray,
  );

  static TextStyle hintText([Locale? locale]) => AppTheme._getSafeTextStyle(
    locale: locale,
    color: AppColors.lightGray,
  );

  static TextStyle resultLabel([Locale? locale]) => AppTheme._getSafeTextStyle(
    locale: locale,
    fontSize: 14,
    fontWeight: FontWeight.w600,
    color: AppColors.primary,
  );
} 