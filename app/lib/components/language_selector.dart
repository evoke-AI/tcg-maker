import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/locale_provider.dart';
import '../theme/app_theme.dart';
import '../l10n/app_localizations.dart';

class LanguageSelector extends StatelessWidget {
  const LanguageSelector({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    
    return Consumer<LocaleProvider>(
      builder: (context, localeProvider, child) {
        final currentLocale = localeProvider.locale;
        
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.displayLanguage,
              style: AppTextStyles.cardTitle(currentLocale).copyWith(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Container(
              width: double.infinity,
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.borderGray),
                borderRadius: BorderRadius.circular(8),
              ),
              child: PopupMenuButton<Locale?>(
                initialValue: localeProvider.locale,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
                  child: Row(
                    children: [
                      Icon(
                        localeProvider.locale == null 
                          ? Icons.phone_android 
                          : Icons.language,
                        size: 16,
                        color: AppColors.mediumGray,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          localeProvider.getLocaleDisplayName(localeProvider.locale),
                          style: AppTextStyles.bodyText(currentLocale),
                        ),
                      ),
                      const Icon(
                        Icons.arrow_drop_down,
                        color: AppColors.mediumGray,
                      ),
                    ],
                  ),
                ),
                itemBuilder: (context) => [
                  // System default option
                  PopupMenuItem<Locale?>(
                    value: null,
                    child: Row(
                      children: [
                        const Icon(Icons.phone_android, size: 16),
                        const SizedBox(width: 8),
                        Text(
                          'System Default',
                          style: AppTextStyles.bodyText(currentLocale),
                        ),
                      ],
                    ),
                  ),
                  // Supported locales
                  ...LocaleProvider.supportedLocales.map((locale) {
                    return PopupMenuItem<Locale?>(
                      value: locale,
                      child: Row(
                        children: [
                          const Icon(Icons.language, size: 16),
                          const SizedBox(width: 8),
                          Text(
                            localeProvider.getLocaleDisplayName(locale),
                            style: AppTextStyles.bodyText(currentLocale),
                          ),
                        ],
                      ),
                    );
                  }),
                ],
                onSelected: (Locale? locale) {
                  localeProvider.setLocale(locale);
                },
              ),
            ),
          ],
        );
      },
    );
  }
} 