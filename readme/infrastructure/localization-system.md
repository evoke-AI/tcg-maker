# App Localization System

## Purpose
The App Localization System provides multi-language support for the Social Translator app's user interface. It manages app UI language switching, preference persistence, and internationalization using Flutter's ARB-based localization framework.

## Architecture Overview

### Localization Components
- **LocaleProvider**: State management for app UI language
- **LanguageSwitcher**: UI component for changing app language
- **AppLocalizations**: Generated localization class with translations
- **ARB Files**: Translation source files for different languages
- **Preference Persistence**: User's app language choice storage

### Supported App Languages
- **English (en)**: Primary language
- **Chinese Traditional (zh)**: Secondary language

## Localization Flow

### 1. App Language Selection
```
User selects app language (LanguageSwitcher)
    ↓
LocaleProvider.setLocale()
    ↓
PreferencesService.saveAppLanguage()
    ↓
App rebuilds with new language
    ↓
All UI text updates to selected language
```

### 2. App Startup Language Loading
```
App starts
    ↓
AuthWrapper checks saved language preference
    ↓
PreferencesService.getAppLanguage()
    ↓
LocaleProvider initialized with saved language
    ↓
App renders in user's preferred language
```

### 3. System Language Integration
```
No saved preference found
    ↓
Check device system language
    ↓
Use system language if supported
    ↓
Fallback to English if not supported
```

## Implementation Details

### LocaleProvider (State Management)
**Location**: `app/lib/providers/locale_provider.dart`

**Key Methods**:
- `setLocale(Locale locale)`: Changes app UI language
- `getLocale()`: Returns current app language
- `loadSavedLocale()`: Loads saved language preference
- `resetToSystemDefault()`: Resets to device language

**State Management**:
```dart
class LocaleProvider extends ChangeNotifier {
  Locale _locale = const Locale('en');
  
  Locale get locale => _locale;
  
  Future<void> setLocale(Locale locale) async {
    _locale = locale;
    await PreferencesService.saveAppLanguage(locale.languageCode);
    notifyListeners();
  }
}
```

### LanguageSwitcher Component
**Location**: `app/lib/components/language_switcher.dart`

**Features**:
- Dropdown menu with supported languages
- Current language indicator
- Immediate language switching
- Preference persistence

**Usage**:
```dart
const LanguageSwitcher()
```

### AppLocalizations (Generated)
**Location**: `app/lib/l10n/app_localizations.dart`

**Generated from ARB files using**:
```bash
flutter gen-l10n
```

**Usage in Components**:
```dart
final l10n = AppLocalizations.of(context)!;
Text(l10n.appTitle); // "Social Translator | evoke AI"
```

### ARB Files (Translation Sources)

#### English ARB
**Location**: `app/lib/l10n/app_en.arb`

**Structure**:
```json
{
  "@@locale": "en",
  "appTitle": "Social Translator | evoke AI",
  "@appTitle": {
    "description": "Main application title"
  },
  "heroTitle": "Social Translator",
  "@heroTitle": {
    "description": "Hero section title"
  }
}
```

#### Chinese Traditional ARB
**Location**: `app/lib/l10n/app_zh.arb`

**Structure**:
```json
{
  "@@locale": "zh",
  "appTitle": "社交翻譯器 | evoke AI",
  "heroTitle": "社交翻譯器"
}
```

## Localization Configuration

### l10n.yaml Configuration
**Location**: `app/l10n.yaml`

```yaml
arb-dir: lib/l10n
template-arb-file: app_en.arb
output-localization-file: app_localizations.dart
output-class: AppLocalizations
```

### Main App Integration
**Location**: `app/lib/main.dart`

```dart
MaterialApp(
  localizationsDelegates: AppLocalizations.localizationsDelegates,
  supportedLocales: AppLocalizations.supportedLocales,
  locale: localeProvider.locale,
  // ... rest of app configuration
)
```

## Language Preference Management

### Preference Storage
```dart
// Save app UI language preference
await PreferencesService.saveAppLanguage('zh');

// Load saved app language
final savedLanguage = await PreferencesService.getAppLanguage();

// Check if language is supported
final isSupported = ['en', 'zh'].contains(languageCode);
```

### System Language Detection
```dart
// Get device system language
final systemLocale = WidgetsBinding.instance.window.locale;

// Use system language if supported, otherwise fallback to English
final appLanguage = supportedLanguages.contains(systemLocale.languageCode) 
  ? systemLocale.languageCode 
  : 'en';
```

## Localized String Categories

### App Navigation & Features
- `appTitle`: Main application title
- `translationFeature`: Translation navigation item
- `aboutFeature`: About navigation item

### Translation Interface
- `enterTextToTranslate`: Translation section title
- `inputPlaceholder`: Text input placeholder
- `translateButton`: Translate button text
- `translatingButton`: Loading state text
- `translationResult`: Result section title

### Feature Descriptions
- `heroTitle`: App hero section title
- `heroSubtitle`: App description
- `featuresTitle`: Features section title
- `aiTranslationTitle`: AI feature title
- `aiTranslationDescription`: AI feature description

### Error Messages
- `errorInvalidText`: Invalid input error
- `errorTranslationFailed`: Translation failure error

### Language Names (for target language selection)
- `languageEnglish`: "English"
- `languageSpanish`: "Spanish"
- `languageFrench`: "French"
- `languageGerman`: "German"
- `languageChinese`: "Chinese"
- `languageJapanese`: "Japanese"
- `languageKorean`: "Korean"
- `languageChineseTraditional`: "Chinese (Traditional)"

## Integration Points

### HomePage Integration
```dart
// Access localized strings
final l10n = AppLocalizations.of(context)!;

// Use in UI
AppBar(
  title: Text(l10n.appTitle),
)
```

### Provider Integration
```dart
// Listen to locale changes
Consumer<LocaleProvider>(
  builder: (context, localeProvider, child) {
    return MaterialApp(
      locale: localeProvider.locale,
      // ... rest of configuration
    );
  },
)
```

## Development Workflow

### Adding New Translations
1. **Add to ARB files**: Update both `app_en.arb` and `app_zh.arb`
2. **Regenerate**: Run `flutter gen-l10n`
3. **Use in code**: Access via `AppLocalizations.of(context)!.newString`

### ARB File Format
```json
{
  "newStringKey": "English text",
  "@newStringKey": {
    "description": "Description of what this string is used for"
  }
}
```

## Testing & Validation

### Language Switching Tests
- **Immediate Update**: UI updates immediately when language changes
- **Persistence**: Language choice persists across app restarts
- **System Integration**: Respects device language on first launch
- **Fallback**: Defaults to English for unsupported languages

### Translation Quality
- **Completeness**: All strings translated in both languages
- **Context**: Translations appropriate for mobile app context
- **Consistency**: Consistent terminology across the app

## Performance Considerations

### Optimization Strategies
- **Lazy Loading**: Translations loaded only when needed
- **Caching**: Locale preferences cached in memory
- **Minimal Rebuilds**: Only affected widgets rebuild on language change
- **Asset Size**: ARB files are lightweight and efficient

## Dependencies

### Flutter Dependencies
- `flutter_localizations`: Core localization support
- `intl`: Internationalization utilities
- `provider`: State management for locale changes
- `shared_preferences`: Language preference persistence

### Development Dependencies
- `flutter gen-l10n`: Code generation for localization classes

## Future Enhancements

### Additional Languages
- **Spanish**: Expand to Spanish-speaking markets
- **French**: European market support
- **Japanese**: Asian market expansion
- **Korean**: Additional Asian language support

### Advanced Features
- **Pluralization**: Support for plural forms
- **Date/Time Formatting**: Locale-specific formatting
- **Number Formatting**: Currency and number localization
- **RTL Support**: Right-to-left language support

## Change Log
- **2024-12-19**: Initial implementation with English and Chinese Traditional
- **2024-12-19**: Added LocaleProvider for state management
- **2024-12-19**: Implemented language preference persistence
- **2024-12-19**: Added system language detection and fallback
- **2024-12-19**: Enhanced LanguageSwitcher component with immediate updates 