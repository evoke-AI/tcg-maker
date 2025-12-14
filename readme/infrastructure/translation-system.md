# AI Translation System

## Purpose
The AI Translation System provides context-aware, social media-optimized translation services using OpenAI's GPT-4o model. The system specializes in preserving tone, cultural context, emojis, and hashtags while delivering high-quality translations for social media content across multiple languages.

## Architecture Overview

### Client-Side (Flutter)
- **TranslationService**: Language mapping, validation, and API integration
- **TranslationPage**: User interface for translation with target language selection
- **Language Persistence**: Target language selection with user preference storage
- **Clipboard Integration**: One-click copy functionality with feedback

### Server-Side (Next.js)
- **Translation Endpoint**: `/api/translate` - Authenticated AI translation service
- **OpenAI Integration**: GPT-4o model with specialized social media prompts
- **Prompt Management**: Specialized translation prompts for social media context
- **Authentication**: JWT-protected endpoint with user validation

## Translation Flow

### 1. User Translation Request
```
User Input (TranslationPage)
    ↓
Text validation & target language selection
    ↓
TranslationService.translateText()
    ↓
POST /api/translate (with JWT auth)
    ↓
Server validates token & input
    ↓
OpenAI GPT-4o translation
    ↓
Specialized social media prompt
    ↓
Translation result returned
    ↓
Display with copy functionality
```

### 2. Target Language Selection & Persistence
```
User selects target language for translation
    ↓
PreferencesService.saveLastSelectedLanguageCode()
    ↓
Target language preference stored
    ↓
Auto-restore on app restart
```

### 3. Clipboard Integration
```
User clicks copy button
    ↓
Clipboard.setData(translatedText)
    ↓
Success/error feedback
    ↓
Visual confirmation to user
```

## Implementation Details

### TranslationService (Flutter)
**Location**: `app/lib/services/translation_service.dart`

**Key Methods**:
- `translateText(text, languageCode, context)`: Main translation function
- `getSupportedLanguages(l10n)`: Returns localized target language list
- `getLanguageCode(localizedName, l10n)`: Maps display name to API code
- `getLocalizedLanguageName(code, l10n)`: Maps API code to display name
- `isValidForTranslation(text)`: Validates input text

**Supported Target Languages**:
- English (en)
- Chinese Simplified (zh-CN)
- Chinese Traditional (zh-TW)
- Spanish (es)
- French (fr)
- German (de)
- Japanese (ja)
- Korean (ko)

**Language Mapping Logic**:
```dart
// Maps localized display names to API language codes for translation targets
String getLanguageCode(String localizedLanguageName, AppLocalizations l10n) {
  final languageMap = {
    l10n.languageEnglish: 'en',
    l10n.languageChineseSimplified: 'zh-CN',
    l10n.languageChineseTraditional: 'zh-TW',
    l10n.languageSpanish: 'es',
    l10n.languageFrench: 'fr',
    l10n.languageGerman: 'de',
    l10n.languageJapanese: 'ja',
    l10n.languageKorean: 'ko',
  };
  return languageMap[localizedLanguageName] ?? 'en';
}
```

### Translation Endpoint (Server)
**Location**: `server/app/api/translate/route.ts`

**Request Processing**:
1. **Authentication**: Validates JWT Bearer token
2. **Input Validation**: Checks text, target language, and length limits
3. **Prompt Loading**: Loads specialized social media translation prompt
4. **OpenAI Request**: Sends request to GPT-4o with system and user prompts
5. **Response Processing**: Extracts and validates translation result
6. **Response**: Returns translated text with metadata

**Security & Validation**:
- JWT token validation for all requests
- Text length limit (5000 characters maximum)
- Input sanitization and validation
- Comprehensive error handling

### Specialized Translation Prompt
**Location**: `server/prompts/translation.txt`

**Prompt Design**:
```
You are a professional translator specializing in social media content. 
Your task is to translate text while preserving the original tone, style, and cultural context.

Guidelines:
1. Maintain the original tone (formal, casual, humorous, etc.)
2. Preserve emojis, hashtags, and mentions (@username)
3. Keep cultural references when possible, or provide culturally appropriate alternatives
4. Maintain the same level of formality or informality
5. For slang or colloquialisms, use equivalent expressions in the target language
6. Keep URLs and links unchanged
7. Preserve line breaks and formatting
```

**Context Preservation Features**:
- **Tone Maintenance**: Preserves formal/casual/humorous tone
- **Emoji Preservation**: Keeps emojis intact across languages
- **Hashtag Handling**: Maintains hashtags and social media conventions
- **Cultural Adaptation**: Provides culturally appropriate alternatives
- **Formatting**: Preserves line breaks and text structure

## Usage Examples

### Basic Translation
```dart
// In TranslationPage
final result = await TranslationService.translateText(
  'Hello world! 👋 #greeting',
  'zh-CN',
  context: 'Social media content',
);
// Result: "你好世界！👋 #greeting"
```

### Target Language Selection with Persistence
```dart
// Save user's preferred target language for translations
await PreferencesService.saveLastSelectedLanguageCode('zh-TW');

// Restore target language preference on app restart
final lastLanguage = await PreferencesService.getLastSelectedLanguageCode();
```

### Clipboard Integration
```dart
// Copy translated text
await Clipboard.setData(ClipboardData(text: translatedText));
ScaffoldMessenger.of(context).showSnackBar(
  const SnackBar(
    content: Text('Copied to clipboard!'),
    backgroundColor: Colors.green,
  ),
);
```

## OpenAI Integration

### Model Configuration
- **Model**: GPT-4o (latest OpenAI model)
- **Temperature**: 0.3 (balanced creativity and consistency)
- **Max Tokens**: 2000 (sufficient for social media content)
- **System Prompt**: Specialized social media translation instructions

### Request Format
```typescript
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ],
  temperature: 0.3,
  max_tokens: 2000,
});
```

### User Prompt Structure
```
Source text: [TEXT TO TRANSLATE]
Target language: [TARGET LANGUAGE]
Context: [SOCIAL MEDIA PLATFORM OR CONTEXT]
```

## Target Language Management

### Language Selection Interface
- **LanguageSelector Component**: Dropdown for selecting translation target language
- **Persistence**: User's last selected target language is remembered
- **Validation**: Ensures target language is selected before translation
- **Localization**: Target language names displayed in current app UI language

### Target Language Preference Storage
```dart
// Save translation target language preference
await PreferencesService.saveLastSelectedLanguageCode('zh-CN');

// Retrieve saved target language
final targetLanguage = await PreferencesService.getLastSelectedLanguageCode();
```

## Error Handling

### Client-Side Validation
1. **Empty Text**: Prevents translation of empty or whitespace-only text
2. **Target Language Selection**: Ensures target language is selected
3. **Network Errors**: Handles connection issues with user feedback
4. **Authentication**: Manages token expiration and re-authentication

### Server-Side Validation
1. **Authentication**: JWT token validation
2. **Input Limits**: 5000 character maximum
3. **Required Fields**: Text and target language validation
4. **OpenAI Errors**: API failure handling and fallbacks

### Error Response Examples
```json
// Client validation error
{ "error": "Please select a target language" }

// Server validation error
{ "error": "Text too long. Maximum 5000 characters allowed." }

// Authentication error
{ "error": "Authorization token required" }

// Translation failure
{ "error": "Translation failed" }
```

## Performance Considerations

### Optimization Strategies
- **Input Validation**: Client-side validation reduces server load
- **Target Language Caching**: Supported languages cached locally
- **Preference Persistence**: Reduces repeated language selection
- **Error Handling**: Graceful degradation for network issues

### Response Times
- **Typical Response**: 2-5 seconds for social media content
- **Factors**: Text length, complexity, OpenAI API response time
- **User Feedback**: Loading indicators during translation

## Dependencies

### Flutter Dependencies
- `http`: HTTP client for API communication
- `flutter/services`: Clipboard integration
- `shared_preferences`: Target language preference storage

### Server Dependencies
- `openai`: OpenAI API client
- `jsonwebtoken`: JWT authentication
- File system access for prompt loading

## Environment Variables
- `OPENAI_API_KEY`: OpenAI API key (required)
- `NEXTAUTH_SECRET`: JWT signing secret (required)

## Testing & Validation

### Test Scenarios
- **Basic Translation**: Simple text translation
- **Social Media Content**: Emojis, hashtags, mentions
- **Cultural Context**: Slang and colloquialisms
- **Error Handling**: Invalid input and network failures
- **Target Language Persistence**: Preference saving and restoration

### Quality Assurance
- **Translation Accuracy**: Manual review of translations
- **Context Preservation**: Verification of tone and style
- **Cultural Appropriateness**: Review by native speakers
- **Performance Testing**: Response time optimization

## Change Log
- **2024-12-19**: Initial implementation with OpenAI GPT-4o integration
- **2024-12-19**: Added specialized social media translation prompt
- **2024-12-19**: Implemented target language preference persistence
- **2024-12-19**: Added clipboard integration with user feedback
- **2024-12-19**: Enhanced error handling and validation 