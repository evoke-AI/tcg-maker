import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../components/feature_card.dart';
import '../providers/locale_provider.dart';
import '../l10n/app_localizations.dart';

class AboutPage extends StatelessWidget {
  const AboutPage({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final locale = Provider.of<LocaleProvider>(context).locale;
    
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeroSection(l10n, locale),
          const SizedBox(height: 32),
          _buildFeaturesSection(l10n, locale),
          const SizedBox(height: 32),
          _buildAboutSection(l10n, locale),
        ],
      ),
    );
  }

  Widget _buildHeroSection(AppLocalizations l10n, Locale? locale) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(32.0),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.primary,
            AppColors.primary.withValues(alpha: 0.8),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            l10n.heroTitle,
            style: AppTextStyles.heroTitle(locale),
          ),
          const SizedBox(height: 8),
          Text(
            l10n.heroSubtitle,
            style: AppTextStyles.heroSubtitle(locale),
          ),
        ],
      ),
    );
  }

  Widget _buildFeaturesSection(AppLocalizations l10n, Locale? locale) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          l10n.featuresTitle,
          style: AppTextStyles.sectionTitle(locale),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: FeatureCard(
                icon: Icons.translate,
                title: l10n.aiTranslationTitle,
                description: l10n.aiTranslationDescription,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: FeatureCard(
                icon: Icons.share,
                title: l10n.socialReadyTitle,
                description: l10n.socialReadyDescription,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildAboutSection(AppLocalizations l10n, Locale? locale) {
    return Card(
      elevation: 2,
      shadowColor: AppColors.black12,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: AppColors.borderGray,
          width: 1,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'About Nowledge',
              style: AppTextStyles.cardTitle(locale),
            ),
            const SizedBox(height: 16),
            Text(
              'Nowledge is an AI-powered application designed to help you translate your social media content with ease. Built by evoke AI, this tool leverages advanced machine learning models to provide accurate and contextually appropriate translations.',
              style: AppTextStyles.bodyText(locale),
            ),
            const SizedBox(height: 16),
            Text(
              'Key Features:',
              style: AppTextStyles.cardTitle(locale).copyWith(fontSize: 16),
            ),
            const SizedBox(height: 8),
            _buildFeaturePoint('• AI-powered translation engine', locale),
            _buildFeaturePoint('• Optimized for social media content', locale),
            _buildFeaturePoint('• Support for multiple languages', locale),
            _buildFeaturePoint('• Clean and intuitive interface', locale),
            _buildFeaturePoint('• Cross-platform compatibility', locale),
          ],
        ),
      ),
    );
  }

  Widget _buildFeaturePoint(String text, Locale? locale) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Text(
        text,
        style: AppTextStyles.bodyText(locale),
      ),
    );
  }
} 