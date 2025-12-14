# Flutter App Structure

## Project Overview
A Flutter-based social media translation app with AI-powered translation capabilities, featuring JWT-based authentication, responsive sidebar navigation, multi-language support, and comprehensive font system for optimal typography across English, Chinese, and Japanese languages. The app connects to a Next.js server backend for secure authentication and OpenAI-powered translation services. Now includes advanced Acurite analysis with image question support for educational document scanning and AI-powered visual content analysis, plus a comprehensive school management system with role-based access control, class management, and bulk user operations.

## Complete System Architecture

### Flutter App (Client)
```
app/
├── lib/
│   ├── components/
│   │   ├── app_sidebar.dart (responsive sidebar with swipe gestures)
│   │   ├── shared_navbar.dart (unified floating navbar with auto-hide functionality)
│   │   ├── feature_card.dart (reusable feature display cards)
│   │   ├── language_switcher.dart (app UI language switcher)
│   │   ├── language_selector.dart (translation target language selector)
│   │   ├── acurite_form.dart (student submission form with validation)
│   │   ├── acurite_analysis.dart (analysis tabs with real-time streaming)
│   │   ├── acurite_history.dart (submission history management)
│   │   ├── acurite_navigation.dart (mobile navigation with page dots)
│   │   └── scan_question_widget_simple.dart (enhanced document scanning with image support)
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
│   ├── models/
│   │   ├── acurite_form.dart (extended with questionImageBase64 support)
│   │   ├── acurite_submission.dart (submission model with image support)
│   │   ├── scan_result.dart (enhanced with visual element detection)
│   │   └── question_answer_pair.dart (extended Q&A model with image data)
│   ├── pages/
│   │   ├── home_page.dart (main app container with sidebar)
│   │   ├── login_page.dart (authentication interface with username/email support)
│   │   ├── translation_page.dart (translation functionality)
│   │   ├── about_page.dart (app information and features)
│   │   ├── acurite_page.dart (main Acurite analysis coordination)
│   │   ├── paragraph_analyzer_page.dart (paragraph analysis functionality)
│   │   └── assistant_page.dart (AI assistant interface)
│   ├── providers/
│   │   ├── locale_provider.dart (app language state management)
│   │   └── acurite_provider.dart (centralized Acurite state with streaming support)
│   ├── services/
│   │   ├── translation_service.dart (AI translation logic)
│   │   ├── auth_service.dart (JWT authentication with username/email support)
│   │   ├── api_service.dart (HTTP client with automatic token refresh)
│   │   ├── preferences_service.dart (user preferences storage)
│   │   └── analysis_service.dart (Acurite analysis with streaming SSE support)
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
│   │   │   └── mobile/ (JWT authentication for Flutter app with username/email support)
│   │   ├── schools/ (school management system)
│   │   │   ├── route.ts (school CRUD operations)
│   │   │   └── [schoolId]/
│   │   │       ├── users/ (school user management with bulk import)
│   │   │       └── roles/ (school-specific role management)
│   │   ├── permissions/ (permission management endpoints)
│   │   ├── translate/ (AI-powered translation endpoint)
│   │   ├── scan/
│   │   │   └── questions/ (enhanced document scanning with visual element detection)
│   │   ├── analysis/
│   │   │   └── acurite/ (comprehensive analysis endpoints with image support)
│   │   │       ├── ai-detect/ (AI detection with visual context)
│   │   │       ├── dse-report/ (DSE analysis with image assessment)
│   │   │       ├── grammar/ (grammar analysis with visual elements)
│   │   │       ├── junior/ (junior feedback with visual comprehension)
│   │   │       └── rewrite/ (response coaching with visual integration)
│   │   └── health/ (server status monitoring)
│   └── services/
│       ├── openai.ts (OpenAI client configuration)
│       ├── load-prompts.ts (prompt file loader)
│       └── analysis-prompts.ts (shared prompt utilities with image support)
├── lib/
│   ├── prisma.ts (database client)
│   ├── auth.ts (password hashing and verification)
│   ├── mobileAuth.ts (shared JWT validation and user status checking)
│   ├── authUtils.ts (enhanced authentication utilities with school permissions)
│   ├── permissions.ts (school-specific permission system)
│   ├── passwordGenerator.ts (school user password generation utilities)
│   ├── errorCodes.ts (centralized authentication error code constants)
│   └── utils.ts (utility functions)
├── prisma/
│   ├── schema.dev.prisma (development database schema with school models)
│   ├── schema.prod.prisma (production database schema with school models)
│   ├── seed.ts (enhanced seed data with school permissions and demo data)
│   └── migrations/ (database migrations including school system)
├── prompts/
│   ├── translation.txt (specialized social media translation prompt)
│   ├── acurite-analysis.txt (comprehensive DSE-style analysis prompt)
│   ├── ai-detect.txt (AI-generated content detection prompt)
│   ├── grammar-analysis.txt (grammar and language analysis prompt)
│   ├── junior-feedback.txt (age-appropriate feedback prompt)
│   └── rewrite-coach.txt (response improvement coaching prompt)
└── readme/
    └── school-system-implementation-plan.md (comprehensive implementation documentation)
```

## School Management System

### Architecture Overview
The system implements a comprehensive school-centric management platform that replaces generic organization models with purpose-built educational functionality. It supports hierarchical class management, school-specific role isolation, and bulk user operations with secure password generation.

### Database Schema
**Core Models:**
- `School` - Central school entity with contact information and settings
- `Class` - Academic classes with teacher assignments and student enrollments
- `SchoolMembership` - User-school relationships with role assignments
- `TeacherClass` - Many-to-many teacher-class assignments
- `StudentClass` - Many-to-many student-class enrollments

**Enhanced User Model:**
- Added `username` field for school-based authentication
- Made `email` optional (not required for students)
- Added `studentId` and `gradeLevel` fields for academic tracking
- Support for dual authentication (username OR email)

**Role System:**
- School-specific roles isolated from system roles
- Role names unique within school context
- Hierarchical permission structure (System > School > Class)

### Permission System
**System Level:**
- `CREATE_SCHOOL` - Super admin can create new schools
- `MANAGE_SYSTEM_ROLES` - System role management
- `ACCESS_ADMIN_DASHBOARD` - System administration access

**School Level:**
- `MANAGE_SCHOOL_USERS` - Create, edit, delete school users
- `MANAGE_SCHOOL_CLASSES` - Class creation and management
- `CREATE_SCHOOL_ROLES` - Custom role creation within school
- `BULK_IMPORT_USERS` - CSV user import functionality
- `GENERATE_USER_PASSWORDS` - Password generation and distribution

**Academic Level:**
- `VIEW_ASSIGNED_CLASSES` - Teacher access to assigned classes
- `MANAGE_CLASS_CONTENT` - Content management within classes
- `VIEW_ENROLLED_CLASSES` - Student access to enrolled classes
- `ACCESS_CLASS_CONTENT` - Student content access

### Authentication System

### Flow Overview
1. **Flutter App Login**: User enters username/email and password on `LoginPage`
2. **Dual Authentication**: `AuthService` supports both username and email login
3. **School Context**: Optional `schoolCode` parameter for school-specific login
4. **JWT Authentication**: Enhanced JWT tokens include school memberships and roles
5. **Server Validation**: Server validates against Prisma database with bcrypt
6. **Token Storage**: JWT token stored in SharedPreferences for persistence
7. **Protected Requests**: All API calls include Bearer token in headers with automatic refresh
8. **Auto-Login**: `AuthWrapper` checks token validity on app startup
9. **Token Refresh**: Automatic token refresh when API calls fail due to expired tokens
10. **Real-time Validation**: Server validates user status and school memberships on every API request

### Security Features
- **Password Hashing**: bcrypt with salt for secure password storage
- **JWT Tokens**: 30-day expiration with enhanced payload including school context
- **School Isolation**: Users can only access data within their assigned schools
- **Username Uniqueness**: Enforced within school context (not globally)
- **Role-based Access**: Granular permissions for different user types
- **Password Generation**: Secure "word-word-word" format passwords (12+ characters)
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
- **School Management System**: Comprehensive educational institution management
- **Role-based Access Control**: Hierarchical permissions (System > School > Class)
- **Dual Authentication**: Username OR email login support
- **Bulk User Operations**: CSV import with automatic password generation
- **JWT Authentication**: Secure token-based authentication with 30-day persistence
- **AI-Powered Translation**: OpenAI GPT-4o with specialized social media prompts
- **Responsive Sidebar Navigation**: Swipe gestures and hamburger menu
- **Multi-language Support**: App UI and translation targets with persistence
- **Multi-Language Font System**: Automatic font selection for optimal typography
- **Font Preloading**: Improved performance with preloaded Google Fonts
- **Offline Capability**: Cached preferences and graceful offline handling
- **Copy to Clipboard**: Easy sharing of translated content with feedback
- **System Language Integration**: Automatic device language detection
- **Advanced Document Analysis**: Acurite analysis with image question support
- **Real-time Streaming**: Server-Sent Events for live analysis feedback

## Component/Function Overview

| Name | Location | Purpose/Description | Related |
|------|----------|-------------------|---------|
| **School Management System** |
| SchoolManagementAPI | server/app/api/schools/route.ts | School CRUD operations with permission validation | AuthUtils, Permissions, Prisma |
| SchoolUserManagementAPI | server/app/api/schools/[schoolId]/users/route.ts | School user management with bulk import and password generation | PasswordGenerator, AuthUtils, Permissions |

| PermissionManagementAPI | server/app/api/permissions/route.ts | Permission listing and categorization | Permissions, AuthUtils |
| **Authentication & Authorization** |
| AuthUtils | server/lib/authUtils.ts | Enhanced authentication utilities with school permission checking | Permissions, MobileAuth, Prisma |
| Permissions | server/lib/permissions.ts | School-specific permission system with role validation | AuthUtils, Prisma |
| PasswordGenerator | server/lib/passwordGenerator.ts | School user password generation with "word-word-word" format and CSV export | SchoolUserManagementAPI |
| MobileAuth | server/lib/mobileAuth.ts | Enhanced JWT validation with school context and user status checking for mobile endpoints | /api/translate, /api/auth/mobile/refresh, Acurite APIs, School APIs |
| **Database & Schema** |
| SchoolSchema | server/prisma/schema.dev.prisma, server/prisma/schema.prod.prisma | Enhanced database schema with school models and relationships | All school-related APIs |
| SeedData | server/prisma/seed.ts | Enhanced seed data with school permissions, roles, and demo school | PasswordGenerator, Auth |
| **Authentication System** |
| LoginPage | lib/pages/login_page.dart | Enhanced authentication interface with username/email support and locale-aware fonts | AuthService, AuthWrapper, AppTheme |
| AuthService | lib/services/auth_service.dart | Enhanced JWT authentication with username/email login and school context | LoginPage, TranslationPage, ApiService |
| AuthWrapper | lib/main.dart | Automatic authentication state management and font loading | LoginPage, HomePage, AppTheme |
| **Translation System** |
| TranslationPage | lib/pages/translation_page.dart | Core translation functionality with locale-aware typography | TranslationService, AuthService, PreferencesService, AppTheme |
| TranslationService | lib/services/translation_service.dart | AI translation logic with language mapping and API integration | TranslationPage, ApiService |
| ApiService | lib/services/api_service.dart | HTTP client for authenticated server communication with automatic token refresh | TranslationService, AuthService |
| **Acurite Analysis System** |
| AcuritePage | lib/pages/acurite_page.dart | Main page coordination with tab management and provider setup | AcuriteProvider, AcuriteFormWidget, AcuriteAnalysisWidget, AcuriteHistoryWidget |
| AcuriteProvider | lib/providers/acurite_provider.dart | Centralized state management for Acurite analysis with streaming support and form validation | AcuriteFormWidget, AcuriteAnalysisWidget, AcuriteHistoryWidget, AnalysisService |
| AcuriteFormWidget | lib/components/acurite_form.dart | Student submission form with validation and read-only mode support | AcuriteProvider, AppTheme |
| AcuriteAnalysisWidget | lib/components/acurite_analysis.dart | Analysis tabs with real-time streaming content and result display | AcuriteProvider, AnalysisService |
| AcuriteHistoryWidget | lib/components/acurite_history.dart | Submission history list with selection and empty state handling | AcuriteProvider |
| AcuriteNavigationWidget | lib/components/acurite_navigation.dart | Mobile navigation with page dots and bottom navigation bar | AcuriteProvider |
| AnalysisService | lib/services/analysis_service.dart | Acurite analysis logic with streaming support for real-time OpenAI responses via Server-Sent Events | AcuriteProvider, ApiService |
| **UI Components** |
| HomePage | lib/pages/home_page.dart | Main app container with sidebar navigation and page routing | AppSidebar, TranslationPage, AboutPage, AcuritePage |
| AppSidebar | lib/components/app_sidebar.dart | Responsive sidebar with swipe gestures, navigation, and locale-aware fonts | HomePage, LanguageSelector, AppTheme |
| SharedNavbar | lib/components/shared_navbar.dart | Unified floating navbar with auto-hide functionality and proper back navigation | AcuritePage, ParagraphAnalyzerPage, AssistantPage, AppTheme |
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
| **Server-Side Acurite Analysis** |
| AcuriteAIDetectAPI | server/app/api/analysis/acurite/ai-detect/route.ts | AI detection analysis endpoint with standard response | AnalysisService |
| AcuriteAIDetectStreamAPI | server/app/api/analysis/acurite/ai-detect/stream/route.ts | AI detection analysis with real-time streaming via Server-Sent Events | AnalysisService |
| AcuriteDSEReportAPI | server/app/api/analysis/acurite/dse-report/route.ts | DSE report analysis endpoint with standard response | AnalysisService |
| AcuriteDSEReportStreamAPI | server/app/api/analysis/acurite/dse-report/stream/route.ts | DSE report analysis with real-time streaming via Server-Sent Events | AnalysisService |
| AcuriteJuniorAPI | server/app/api/analysis/acurite/junior/route.ts | Junior student analysis endpoint with standard response | AnalysisService |
| AcuriteJuniorStreamAPI | server/app/api/analysis/acurite/junior/stream/route.ts | Junior student analysis with real-time streaming via Server-Sent Events | AnalysisService |
| AcuriteRewriteAPI | server/app/api/analysis/acurite/rewrite/route.ts | Rewrite analysis endpoint with standard response | AnalysisService |
| AcuriteRewriteStreamAPI | server/app/api/analysis/acurite/rewrite/stream/route.ts | Rewrite analysis with real-time streaming via Server-Sent Events | AnalysisService |
| AcuriteGrammarAPI | server/app/api/analysis/acurite/grammar/route.ts | Grammar analysis endpoint with standard response | AnalysisService |
| AcuriteGrammarStreamAPI | server/app/api/analysis/acurite/grammar/stream/route.ts | Grammar analysis with real-time streaming via Server-Sent Events | AnalysisService |
| **Server-Side Core** |
| MobileAuth | server/lib/mobileAuth.ts | Enhanced JWT validation with school context and user status checking for mobile endpoints | /api/translate, /api/auth/mobile/refresh, Acurite APIs, School APIs |
| ErrorCodes | server/lib/errorCodes.ts | Centralized authentication error code constants for server | mobileAuth.ts, /api/auth/mobile |
| **Analysis Prompts System** |
| buildAiDetectContent | server/app/services/analysis-prompts.ts | Builds AI detection analysis content with file-based prompts and visual element support | AcuriteAIDetectAPI, AcuriteAIDetectStreamAPI |
| buildDseReportContent | server/app/services/analysis-prompts.ts | Builds DSE report analysis content using comprehensive HKDSE marking rubric | AcuriteDSEReportAPI, AcuriteDSEReportStreamAPI |
| buildGrammarContent | server/app/services/analysis-prompts.ts | Builds grammar analysis content with detailed language assessment prompts | AcuriteGrammarAPI, AcuriteGrammarStreamAPI |
| buildJuniorContent | server/app/services/analysis-prompts.ts | Builds junior student feedback content with age-appropriate encouragement | AcuriteJuniorAPI, AcuriteJuniorStreamAPI |
| buildRewriteContent | server/app/services/analysis-prompts.ts | Builds rewrite coaching content with writing improvement guidance | AcuriteRewriteAPI, AcuriteRewriteStreamAPI |
| loadPromptFile | server/app/services/load-prompts.ts | Secure server-side prompt file loader with 'use server' compliance | All analysis prompt building functions |

## Architecture Patterns
- **School-Centric Design**: Purpose-built educational institution management
- **Role-based Access Control**: Hierarchical permissions with school isolation
- **Dual Authentication**: Flexible username/email login system
- **JWT Authentication**: Token-based security with automatic refresh and persistence
- **Service Layer Architecture**: Clear separation between UI, business logic, and data
- **Provider Pattern**: State management for locale, authentication, and analysis state
- **Multi-Language Font System**: Automatic font selection based on locale with comprehensive fallbacks
- **Font Preloading**: Performance optimization with Google Fonts preloading
- **Feature-based Organization**: Pages, components, and services logically grouped
- **Responsive Design**: Sidebar adapts to mobile and desktop layouts with gestures
- **API Integration**: RESTful communication with Next.js backend
- **Error Handling**: Comprehensive error handling with user feedback
- **Internationalization**: ARB-based localization with code generation
- **Theme System**: Centralized styling with locale-aware typography
- **Preference Persistence**: User settings maintained across app sessions
- **Real-time Streaming**: Server-Sent Events for live analysis feedback

## Server-Side Architecture
- **Next.js API Routes**: RESTful endpoints for authentication, translation, and school management
- **Prisma ORM**: Type-safe database operations with PostgreSQL/SQLite
- **OpenAI Integration**: GPT-4o model with specialized prompts for social media and education
- **JWT Security**: Stateless authentication with secure token validation and school context
- **Environment Configuration**: Secure credential management with environment variables
- **School Data Isolation**: Membership-based access control for multi-tenant architecture
- **Bulk Operations**: CSV import/export with password generation for efficient user management
- **Permission System**: Granular role-based access control with school-specific isolation

## Image Question Analysis System

### Enhanced Document Scanning Flow
1. **Document Upload**: Students scan pages containing questions with visual elements
2. **Smart Detection**: GPT-4o vision automatically identifies pages with graphs, charts, diagrams
3. **Image Extraction**: Question images extracted and stored as base64 data
4. **Visual Indicators**: UI shows eye icon for questions with visual elements
5. **Enhanced Analysis**: All analysis types consider both text and visual context
6. **Comprehensive Feedback**: AI assesses how well students address visual elements

### Visual Element Support
- **Graph Types**: Line graphs, bar charts, pie charts, scatter plots
- **Educational Diagrams**: Scientific illustrations, mathematical figures, flowcharts
- **Data Tables**: Structured data requiring interpretation
- **Maps & Geography**: Geographical content and spatial relationships
- **Mixed Content**: Documents with both text-only and visual questions

### Analysis Enhancement
- **AI Detection**: Considers visual reference patterns in AI-generated content detection
- **DSE Reports**: Comprehensive assessment including visual element handling
- **Grammar Analysis**: Evaluates visual element descriptions for language usage
- **Junior Feedback**: Age-appropriate visual comprehension assessment
- **Response Coaching**: Ensures rewritten responses address visual elements

| **Image Question Analysis System** |
| ScanQuestionWidgetSimple | lib/components/scan_question_widget_simple.dart | Enhanced scanning widget with question image data passing | AcuriteProvider, AnalysisService |
| AcuriteForm (Enhanced) | lib/models/acurite_form.dart | Extended data model with questionImageBase64 field support | AcuriteProvider, AnalysisService |
| AcuriteSubmission (Enhanced) | lib/models/acurite_submission.dart | Extended submission model with image support | AcuriteProvider, AcuriteHistoryWidget |
| ScanResult (Enhanced) | lib/models/scan_result.dart | Enhanced scan result with visual element detection | ScanQuestionWidgetSimple, AcuriteProvider |
| QuestionAnswerPair (Enhanced) | lib/models/question_answer_pair.dart | Extended Q&A model with image data support | AcuriteForm, ScanResult |
| **Server-Side Image Analysis** |
| ScanQuestionsEndpoint | server/app/api/scan/questions/route.ts | Enhanced document scanning with visual element detection using GPT-4o vision | AnalysisPromptsService |
| AnalysisPromptsService | server/app/services/analysis-prompts.ts | Centralized prompt building utilities with image support and base64 validation | All analysis endpoints |
| AiDetectEndpoint (Enhanced) | server/app/api/analysis/acurite/ai-detect/ | AI detection analysis with visual context consideration | AnalysisPromptsService |
| DseReportEndpoint (Enhanced) | server/app/api/analysis/acurite/dse-report/ | Comprehensive DSE analysis with visual element assessment | AnalysisPromptsService |
| GrammarEndpoint (Enhanced) | server/app/api/analysis/acurite/grammar/ | Grammar analysis with visual element description evaluation | AnalysisPromptsService |
| JuniorEndpoint (Enhanced) | server/app/api/analysis/acurite/junior/ | Junior feedback with visual comprehension assessment | AnalysisPromptsService |
| RewriteEndpoint (Enhanced) | server/app/api/analysis/acurite/rewrite/ | Response coaching with visual element integration | AnalysisPromptsService | 