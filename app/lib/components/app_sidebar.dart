import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../l10n/app_localizations.dart';
import '../providers/locale_provider.dart';
import '../services/auth_service.dart';
import '../components/language_selector.dart';

enum AppFeature {
  translation,
  about,
}

class AppSidebar extends StatelessWidget {
  final bool isOpen;
  final VoidCallback onClose;
  final Function(AppFeature) onFeatureSelected;
  final AppFeature currentFeature;

  const AppSidebar({
    super.key,
    required this.isOpen,
    required this.onClose,
    required this.onFeatureSelected,
    required this.currentFeature,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final localeProvider = Provider.of<LocaleProvider>(context);
    final locale = localeProvider.locale;
    
    return Stack(
      children: [
        // Backdrop
        if (isOpen)
          GestureDetector(
            onTap: onClose,
            child: Container(
              color: Colors.black.withValues(alpha: 0.5),
            ),
          ),
        
        // Sidebar
        AnimatedPositioned(
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeInOut,
          left: isOpen ? 0 : -280,
          top: 0,
          bottom: 0,
          width: 280,
          child: GestureDetector(
            onHorizontalDragUpdate: (details) {
              // Handle swipe to close
              if (details.delta.dx < -5) {
                onClose();
              }
            },
            child: Material(
              elevation: 8,
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.white,
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.black12,
                      offset: const Offset(2, 0),
                      blurRadius: 8,
                    ),
                  ],
                ),
                child: SafeArea(
                  child: Column(
                    children: [
                      // Header
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                        ),
                        child: Row(
                          children: [
                            Image.asset(
                              'assets/images/logo_small.png',
                              height: 32,
                              fit: BoxFit.contain,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                l10n.heroTitle,
                                style: AppTextStyles.heroTitle(locale).copyWith(
                                  fontSize: 18,
                                  color: AppColors.white,
                                ),
                              ),
                            ),
                            IconButton(
                              onPressed: onClose,
                              icon: const Icon(
                                Icons.close,
                                color: AppColors.white,
                              ),
                            ),
                          ],
                        ),
                      ),
                      
                      // Navigation items
                      Expanded(
                        child: ListView(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          children: [
                            _buildNavItem(
                              context,
                              icon: Icons.translate,
                              title: l10n.translationFeature,
                              feature: AppFeature.translation,
                              isSelected: currentFeature == AppFeature.translation,
                            ),
                            _buildNavItem(
                              context,
                              icon: Icons.info_outline,
                              title: l10n.aboutFeature,
                              feature: AppFeature.about,
                              isSelected: currentFeature == AppFeature.about,
                            ),
                            
                            // Divider
                            const Padding(
                              padding: EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                              child: Divider(),
                            ),
                            
                            // Language selector
                            const Padding(
                              padding: EdgeInsets.symmetric(horizontal: 24),
                              child: LanguageSelector(),
                            ),
                            
                            const SizedBox(height: 16),
                            
                            // Logout button
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 24),
                              child: SizedBox(
                                width: double.infinity,
                                child: ElevatedButton.icon(
                                  onPressed: () => _logout(context),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.red,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(vertical: 12),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                  ),
                                  icon: const Icon(Icons.logout, size: 18),
                                  label: Text(
                                    l10n.logoutButton,
                                    style: AppTextStyles.buttonText(locale).copyWith(
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildNavItem(
    BuildContext context, {
    required IconData icon,
    required String title,
    required AppFeature feature,
    required bool isSelected,
  }) {
    final locale = Provider.of<LocaleProvider>(context).locale;
    
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => onFeatureSelected(feature),
          borderRadius: BorderRadius.circular(8),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: isSelected ? AppColors.primary.withValues(alpha: 0.1) : Colors.transparent,
              borderRadius: BorderRadius.circular(8),
              border: isSelected 
                ? Border.all(color: AppColors.primary.withValues(alpha: 0.3))
                : null,
            ),
            child: Row(
              children: [
                Icon(
                  icon,
                  color: isSelected ? AppColors.primary : AppColors.mediumGray,
                  size: 20,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    title,
                    style: AppTextStyles.bodyText(locale).copyWith(
                      color: isSelected ? AppColors.primary : AppColors.darkGray,
                      fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _logout(BuildContext context) async {
    try {
      await AuthService.logout();
      if (context.mounted) {
        Navigator.of(context).pushReplacementNamed('/login');
      }
    } catch (e) {
      // Handle logout error if needed
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Logout failed: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
} 