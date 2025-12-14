# Main.dart File Split Documentation

## Rationale for the Split

The original `main.dart` file had grown to 376 lines and violated the Single Responsibility Principle by containing multiple unrelated concerns:
- App configuration and theming
- Home page UI and state management  
- Feature card component definition
- Translation logic
- Hardcoded styling constants

This monolithic structure made the code difficult to maintain, test, and extend. Following the [98.split-large-files.mdc](mdc:.cursor/rules/98.split-large-files.mdc) rule, we performed a one-shot remediation to restore codebase health.

## New File Structure

### Before Split
- `main.dart` (376 lines) - Everything in one file

### After Split
- `main.dart` (18 lines) - App entry point and configuration only
- `theme/app_theme.dart` (95 lines) - Centralized theme, colors, and text styles
- `pages/home_page.dart` (285 lines) - Home page UI and state management
- `components/feature_card.dart` (55 lines) - Reusable feature card component
- `services/translation_service.dart` (35 lines) - Translation logic and validation

## Key Design Decisions

1. **Theme Extraction**: All colors, text styles, and theme configuration moved to dedicated theme files for consistency and maintainability.

2. **Component Separation**: The `_FeatureCard` was extracted into a public `FeatureCard` component for reusability across the app.

3. **Service Layer**: Translation logic was moved to a service class, making it future-ready for real API integration.

4. **Improved Error Handling**: Added proper error handling and validation in the translation service.

5. **Better State Management**: Enhanced the home page with proper disposal of controllers and error feedback.

## Benefits Achieved

- **Single Responsibility**: Each file now has one clear purpose
- **Maintainability**: Easier to locate and modify specific functionality
- **Reusability**: Components can be reused across different pages
- **Testability**: Individual components can be tested in isolation
- **Scalability**: New features can be added without bloating existing files

## References
- [01.core-rules.mdc](mdc:.cursor/rules/01.core-rules.mdc) - Core programming principles
- [98.split-large-files.mdc](mdc:.cursor/rules/98.split-large-files.mdc) - Large file split rule 