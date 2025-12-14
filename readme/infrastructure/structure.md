# Nowledge - Flutter App Structure

## Project Overview
A Flutter-based social media translation app with AI-powered translation capabilities, featuring JWT-based authentication, responsive sidebar navigation, multi-language support, and comprehensive font system for optimal typography across English, Chinese, and Japanese languages. The app connects to a Next.js server backend for secure authentication and OpenAI-powered translation services.

## Complete System Architecture

### Flutter App (Client)
```
app/
├── lib/
│   ├── components/
│   │   ├── app_sidebar.dart (responsive sidebar with swipe gestures)
│   │   ├── feature_card.dart (reusable feature display cards)
│   │   ├── language_switcher.dart (app UI language switcher)
│   │   └── language_selector.dart (translation target language selector)
│   ├── constants/
│   │   └── auth_error_codes.dart (centralized authentication error codes)
│   ├── l10n/ (internationalization)
│   │   ├── app_localizations.dart (generated localization class)
│   │   ├── app_localizations_en.dart (English translations)
│   │   ├── app_localizations_zh.dart (Chinese translations)
│   │   ├── app_localizations_ja.dart (Japanese translations)
│   │   ├── app_en.arb (English ARB file)
│   │   ├── app_zh.arb (Chinese ARB file)
│   │   └── app_ja.arb (Japanese ARB file)
│   ├── pages/
│   │   ├── home_page.dart (main app container with sidebar)
│   │   ├── login_page.dart (authentication interface)
│   │   ├── translation_page.dart (translation functionality)
│   │   └── about_page.dart (app information and features)
│   ├── providers/
│   │   └── locale_provider.dart (app language state management)
│   ├── services/
│   │   ├── translation_service.dart (AI translation logic)
│   │   ├── auth_service.dart (JWT authentication)
│   │   ├── api_service.dart (HTTP client for server communication with automatic token refresh)
│   │   └── preferences_service.dart (user preferences storage)
│   ├── theme/
│   │   └── app_theme.dart (multi-language font system, colors, text styles)
│   └── main.dart (app entry point with auth wrapper and font preloading)
├── assets/
│   └── images/ (app logos and assets)
├── l10n.yaml (localization configuration)
└── pubspec.yaml (dependencies and configuration)
```

### Next.js Server (Backend)
```
server/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── mobile/ (JWT authentication for Flutter app)
│   │   ├── translate/ (AI-powered translation endpoint)
│   │   └── health/ (server status monitoring)
│   └── services/
│       ├── openai.ts (OpenAI client configuration)
│       └── load-prompts.ts (prompt file loader)
├── prompts/
│   └── translation.txt (specialized social media translation prompt)
├── prisma/
│   ├── schema.prisma (database schema)
│   └── migrations/ (database migrations)
└── lib/
    ├── prisma.ts (database client)
    ├── mobileAuth.ts (shared JWT validation and user status checking)
    └── errorCodes.ts (centralized authentication error code constants)
```

## Authentication System

### Flow Overview
1. **Flutter App Login**: User enters credentials on `LoginPage`
2. **JWT Authentication**: `AuthService` sends credentials to `/api/auth/mobile`
3. **Server Validation**: Server validates against Prisma database with bcrypt
4. **Token Storage**: JWT token stored in SharedPreferences for persistence
5. **Protected Requests**: All API calls include Bearer token in headers with automatic refresh
6. **Auto-Login**: `AuthWrapper` checks token validity on app startup
7. **Token Refresh**: Automatic token refresh when API calls fail due to expired tokens
8. **Real-time Validation**: Server validates user status on every API request

### Security Features
- **Password Hashing**: bcrypt with salt for secure password storage
- **JWT Tokens**: 30-day expiration with user payload and automatic refresh
- **Account Status**: Active/inactive user validation on every API request
- **Token Persistence**: Secure local storage with SharedPreferences
- **Logout Cleanup**: Selective preference clearing (preserves language settings)
- **Real-time User Validation**: Database checks on every protected API call
- **Automatic Token Refresh**: Seamless token renewal for permission changes
- **Account Status Enforcement**: Automatic logout when accounts are deactivated or removed
- **Error Code System**: Structured error codes instead of fragile text matching
- **Automatic Navigation**: Seamless redirect to login when logout is required

## Translation System

### AI Translation Flow
1. **Input Validation**: Text length and target language selection validation
2. **API Request**: Authenticated request to `/api/translate` endpoint
3. **OpenAI Integration**: GPT-4o model with specialized social media prompt
4. **Context Preservation**: Maintains tone, emojis, hashtags, and cultural context
5. **Response Handling**: Error handling with user-friendly feedback
6. **Clipboard Integration**: One-click copy functionality with success feedback

### Target Language Support
- **Translation Targets**: English, Chinese Simplified, Chinese Traditional, Spanish, French, German, Japanese, Korean
- **Target Language Persistence**: User's preferred translation target language saved across sessions
- **Language Mapping**: Localized language names mapped to API language codes

## App Localization System

### UI Language Flow
1. **Language Selection**: User selects app UI language via LanguageSwitcher
2. **State Management**: LocaleProvider manages app language state
3. **Preference Storage**: App language choice saved to SharedPreferences
4. **App Rebuild**: Entire app rebuilds with new language
5. **System Integration**: Respects device language on first launch

### App UI Language Support
- **App UI Languages**: English (en), Chinese Traditional (zh)
- **ARB-based Localization**: Flutter's internationalization framework
- **Code Generation**: Automated localization class generation
- **Fallback System**: Defaults to English for unsupported languages

## Multi-Language Font System

### Font Selection Strategy
The app automatically selects appropriate fonts based on the user's locale:
- **English**: Inter (clean, modern sans-serif)
- **Traditional Chinese (zh-TW)**: Noto Sans TC (optimized for Traditional Chinese characters)
- **Simplified Chinese (zh-CN)**: Noto Sans SC (optimized for Simplified Chinese characters)
- **Japanese**: Noto Sans JP (optimized for Japanese characters including Hiragana, Katakana, Kanji)

### Font Loading Flow
1. **App Initialization**: Fonts preloaded during app startup for better performance
2. **Locale Detection**: Current locale retrieved from LocaleProvider
3. **Font Selection**: Appropriate font family selected based on locale
4. **Fallback System**: Comprehensive fallback stack for each language
5. **Component Integration**: All UI components automatically use locale-aware fonts

### Font Fallback System
Each language has a comprehensive fallback stack:
- **Chinese**: Noto Sans TC/SC → PingFang TC/SC → Microsoft YaHei → SimHei → system-ui
- **Japanese**: Noto Sans JP → Hiragino Kaku Gothic ProN → Yu Gothic → Meiryo → system-ui
- **English**: Inter → system-ui → -apple-system → BlinkMacSystemFont → Segoe UI → Roboto

### Performance Optimizations
- **Font Preloading**: Google Fonts preloaded during app initialization
- **Parallel Loading**: Fonts loaded in parallel with authentication check
- **Caching**: Font files cached by Google Fonts package
- **Error Handling**: Graceful fallback to system fonts if Google Fonts fail

## Supported Languages
- **English (en)**: Primary language with Inter font
- **Chinese Traditional (zh-TW)**: Secondary language with Noto Sans TC font
- **Japanese (ja)**: Tertiary language with Noto Sans JP font

## Key Features
- **JWT Authentication**: Secure token-based authentication with 30-day persistence
- **AI-Powered Translation**: OpenAI GPT-4o with specialized social media prompts
- **Responsive Sidebar Navigation**: Swipe gestures and hamburger menu
- **Multi-language Support**: App UI and translation targets with persistence
- **Multi-Language Font System**: Automatic font selection for optimal typography
- **Font Preloading**: Improved performance with preloaded Google Fonts
- **Offline Capability**: Cached preferences and graceful offline handling
- **Copy to Clipboard**: Easy sharing of translated content with feedback
- **System Language Integration**: Automatic device language detection

## Component/Function Overview

| Name | Location | Purpose/Description | Related |
|------|----------|-------------------|---------|
| **Authentication System** |
| LoginPage | lib/pages/login_page.dart | User authentication interface with locale-aware fonts | AuthService, AuthWrapper, AppTheme |
| AuthService | lib/services/auth_service.dart | JWT authentication, token management, automatic refresh, and session handling | LoginPage, TranslationPage, ApiService |
| AuthWrapper | lib/main.dart | Automatic authentication state management and font loading | LoginPage, HomePage, AppTheme |
| **Translation System** |
| TranslationPage | lib/pages/translation_page.dart | Core translation functionality with locale-aware typography | TranslationService, AuthService, PreferencesService, AppTheme |
| TranslationService | lib/services/translation_service.dart | AI translation logic with language mapping and API integration | TranslationPage, ApiService |
| ApiService | lib/services/api_service.dart | HTTP client for authenticated server communication with automatic token refresh | TranslationService, AuthService |
| **UI Components** |
| HomePage | lib/pages/home_page.dart | Main app container with sidebar navigation and page routing | AppSidebar, TranslationPage, AboutPage |
| AppSidebar | lib/components/app_sidebar.dart | Responsive sidebar with swipe gestures, navigation, and locale-aware fonts | HomePage, LanguageSelector, AppTheme |
| AboutPage | lib/pages/about_page.dart | App information with locale-appropriate typography | FeatureCard, AppTheme |
| FeatureCard | lib/components/feature_card.dart | Reusable card component with locale-aware text rendering | AboutPage, AppTheme |
| **Language & Font Management** |
| LanguageSwitcher | lib/components/language_switcher.dart | App UI language switcher component | HomePage, LocaleProvider |
| LanguageSelector | lib/components/language_selector.dart | Display language dropdown with locale-aware fonts | AppSidebar, LocaleProvider, AppTheme |
| LocaleProvider | lib/providers/locale_provider.dart | App language state management with persistence | LanguageSelector, main.dart, AppTheme |
| AppTheme | lib/theme/app_theme.dart | Multi-language font system, theme configuration, and font preloading | All UI components |
| **Services & Utilities** |
| PreferencesService | lib/services/preferences_service.dart | User preferences storage and retrieval (language, settings) | TranslationPage, LocaleProvider |
| AppLocalizations | lib/l10n/app_localizations.dart | Generated localization class with multi-language support | All components |
| AuthErrorCodes | app/lib/constants/auth_error_codes.dart | Centralized authentication error code constants for Flutter | AuthService |
| MobileAuth | server/lib/mobileAuth.ts | Shared JWT validation and user status checking for mobile endpoints | /api/translate, /api/auth/mobile/refresh |
| ErrorCodes | server/lib/errorCodes.ts | Centralized authentication error code constants for server | mobileAuth.ts, /api/auth/mobile |

## Architecture Patterns
- **JWT Authentication**: Token-based security with automatic refresh and persistence
- **Service Layer Architecture**: Clear separation between UI, business logic, and data
- **Provider Pattern**: State management for locale and authentication state
- **Multi-Language Font System**: Automatic font selection based on locale with comprehensive fallbacks
- **Font Preloading**: Performance optimization with Google Fonts preloading
- **Feature-based Organization**: Pages, components, and services logically grouped
- **Responsive Design**: Sidebar adapts to mobile and desktop layouts with gestures
- **API Integration**: RESTful communication with Next.js backend
- **Error Handling**: Comprehensive error handling with user feedback
- **Internationalization**: ARB-based localization with code generation
- **Theme System**: Centralized styling with locale-aware typography
- **Preference Persistence**: User settings maintained across app sessions

## Server-Side Architecture
- **Next.js API Routes**: RESTful endpoints for authentication and translation
- **Prisma ORM**: Type-safe database operations with PostgreSQL
- **OpenAI Integration**: GPT-4o model with specialized prompts for social media
- **JWT Security**: Stateless authentication with secure token validation
- **Environment Configuration**: Secure credential management with environment variables 