import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../services/translation_service.dart';
import '../services/preferences_service.dart';
import '../providers/locale_provider.dart';
import '../l10n/app_localizations.dart';

class TranslationPage extends StatefulWidget {
  const TranslationPage({super.key});

  @override
  State<TranslationPage> createState() => _TranslationPageState();
}

class _TranslationPageState extends State<TranslationPage> {
  final TextEditingController _textController = TextEditingController();
  
  String _translatedText = '';
  bool _isTranslating = false;
  String _selectedLanguage = ''; // This will store the localized language name

  @override
  void initState() {
    super.initState();
    _loadLastSelectedLanguage();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Reload language when app language changes
    _reloadSelectedLanguage();
  }

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  /// Reload the selected language when app language changes
  void _reloadSelectedLanguage() {
    if (_selectedLanguage.isNotEmpty) {
      _loadLastSelectedLanguage();
    }
  }

  /// Load the last selected language from preferences
  Future<void> _loadLastSelectedLanguage() async {
    final lastLanguageCode = await PreferencesService.getLastSelectedLanguageCode();
    if (lastLanguageCode != null && mounted) {
      final l10n = AppLocalizations.of(context);
      if (l10n != null) {
        final localizedName = TranslationService.getLocalizedLanguageName(lastLanguageCode, l10n);
        final supportedLanguages = TranslationService.getSupportedLanguages(l10n);
        
        // Only set if the localized name exists in current supported languages
        if (supportedLanguages.contains(localizedName)) {
          setState(() {
            _selectedLanguage = localizedName;
          });
        } else {
          // Clear invalid selection
          setState(() {
            _selectedLanguage = '';
          });
        }
      }
    }
  }

  /// Save the selected language to preferences
  Future<void> _saveSelectedLanguage(String localizedLanguageName) async {
    final l10n = AppLocalizations.of(context)!;
    final languageCode = TranslationService.getLanguageCode(localizedLanguageName, l10n);
    await PreferencesService.saveLastSelectedLanguageCode(languageCode);
  }

  Future<void> _translateText() async {
    final text = _textController.text.trim();
    final l10n = AppLocalizations.of(context)!;
    
    if (!TranslationService.isValidForTranslation(text)) {
      _showErrorSnackBar(l10n.errorInvalidText);
      return;
    }

    if (_selectedLanguage.isEmpty) {
      _showErrorSnackBar('Please select a target language');
      return;
    }
    
    setState(() {
      _isTranslating = true;
      _translatedText = '';
    });

    try {
      final languageCode = TranslationService.getLanguageCode(_selectedLanguage, l10n);
      final result = await TranslationService.translateText(
        text, 
        languageCode,
        context: 'Social media content',
      );
      setState(() {
        _translatedText = result;
      });
    } catch (e) {
      _showErrorSnackBar('${l10n.errorTranslationFailed}: ${e.toString()}');
    } finally {
      setState(() {
        _isTranslating = false;
      });
    }
  }

  /// Copy translated text to clipboard
  Future<void> _copyToClipboard() async {
    if (_translatedText.isNotEmpty) {
      try {
        await Clipboard.setData(ClipboardData(text: _translatedText));
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Copied to clipboard!'),
              backgroundColor: Colors.green,
              duration: Duration(seconds: 2),
            ),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Failed to copy: ${e.toString()}'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildTranslationSection(l10n),
        ],
      ),
    );
  }

  Widget _buildTranslationSection(AppLocalizations l10n) {
    final locale = Provider.of<LocaleProvider>(context).locale;
    
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
              l10n.enterTextToTranslate,
              style: AppTextStyles.cardTitle(locale),
            ),
            const SizedBox(height: 16),
            _buildInputField(l10n),
            const SizedBox(height: 16),
            _buildLanguageSelector(l10n),
            const SizedBox(height: 16),
            _buildTranslateButton(l10n),
            if (_translatedText.isNotEmpty) ...[
              const SizedBox(height: 24),
              _buildTranslationResult(l10n),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildInputField(AppLocalizations l10n) {
    final locale = Provider.of<LocaleProvider>(context).locale;
    
    return TextField(
      controller: _textController,
      maxLines: 4,
      decoration: InputDecoration(
        hintText: l10n.inputPlaceholder,
        hintStyle: AppTextStyles.hintText(locale),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(
            color: AppColors.borderGray,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(
            color: AppColors.primary,
            width: 2,
          ),
        ),
        filled: true,
        fillColor: AppColors.backgroundGray,
      ),
      style: AppTextStyles.bodyText(locale),
    );
  }

  Widget _buildLanguageSelector(AppLocalizations l10n) {
    final locale = Provider.of<LocaleProvider>(context).locale;
    final languages = TranslationService.getSupportedLanguages(l10n);
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Target Language',
          style: AppTextStyles.cardTitle(locale).copyWith(fontSize: 16),
        ),
        const SizedBox(height: 8),
        InputDecorator(
          decoration: InputDecoration(
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(
                color: AppColors.borderGray,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(
                color: AppColors.primary,
                width: 2,
              ),
            ),
            filled: true,
            fillColor: AppColors.backgroundGray,
            contentPadding: EdgeInsets.zero,
          ),
          child: ButtonTheme(
            alignedDropdown: true,
            child: DropdownButton<String>(
              key: ValueKey('language_selector_${l10n.languageEnglish}'),
              value: _selectedLanguage.isEmpty || !languages.contains(_selectedLanguage) ? null : _selectedLanguage,
              hint: Text(
                'Select target language',
                style: AppTextStyles.hintText(locale),
              ),
              style: AppTextStyles.bodyText(locale),
              isExpanded: true,
              underline: const SizedBox(),
              items: languages.map((language) {
                return DropdownMenuItem<String>(
                  value: language,
                  child: Text(
                    language,
                    style: AppTextStyles.bodyText(locale),
                  ),
                );
              }).toList(),
              onChanged: (value) {
                if (value != null) {
                  setState(() {
                    _selectedLanguage = value;
                  });
                  _saveSelectedLanguage(value);
                }
              },
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTranslateButton(AppLocalizations l10n) {
    final locale = Provider.of<LocaleProvider>(context).locale;
    
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: _isTranslating ? null : _translateText,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          elevation: 0,
        ),
        child: _isTranslating
            ? Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        AppColors.white,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    l10n.translatingButton,
                    style: AppTextStyles.buttonText(locale),
                  ),
                ],
              )
            : Text(
                l10n.translateButton,
                style: AppTextStyles.buttonText(locale),
              ),
      ),
    );
  }

  Widget _buildTranslationResult(AppLocalizations l10n) {
    final locale = Provider.of<LocaleProvider>(context).locale;
    
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.lightBlue,
        border: Border.all(
          color: AppColors.primary.withValues(alpha: 0.2),
        ),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            l10n.translationResult,
            style: AppTextStyles.resultLabel(locale),
          ),
          const SizedBox(height: 8),
          Text(
            _translatedText,
            style: AppTextStyles.bodyText(locale),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _copyToClipboard,
                  icon: const Icon(Icons.copy, size: 16),
                  label: Text(
                    'Copy',
                    style: AppTextStyles.buttonText(locale).copyWith(
                      color: AppColors.primary,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                    foregroundColor: AppColors.primary,
                    elevation: 0,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
} 