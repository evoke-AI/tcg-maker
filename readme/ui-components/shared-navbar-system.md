# Shared Navbar System

## Purpose
A unified navigation component that provides consistent styling, auto-hide functionality, and proper back navigation across all ported features in the Flutter app. This system ensures that features like Acurite, Paragraph Analyzer, and Assistant pages have the same modern floating navbar experience as the home page, while solving the black screen navigation issue.

## Usage

### Basic Implementation
```dart
SharedNavbar(
  title: 'Feature Title',
  scrollController: _scrollController,
  showBackButton: true,
  onBackPressed: () => _navigateToHome(),
)
```

### With Actions
```dart
SharedNavbar(
  title: 'Assistant Chat',
  scrollController: _scrollController,
  showBackButton: true,
  onBackPressed: widget.onBackPressed,
  actions: [
    IconButton(
      onPressed: _toggleHistory,
      icon: const Icon(Icons.history),
    ),
  ],
)
```

### Parameters
- **title** (required): The page title displayed in the navbar
- **scrollController**: Optional scroll controller for auto-hide functionality
- **showBackButton**: Whether to show the back arrow (default: false)
- **onBackPressed**: Custom callback for back navigation
- **onMenuPressed**: Custom callback for menu button (alternative to back button)
- **actions**: List of action widgets (typically IconButtons)

## Design & Implementation Notes

### Auto-Hide Functionality
- Uses `AnimationController` with slide transition to hide/show navbar on scroll
- Threshold of 10px scroll difference prevents jittery behavior
- Smooth 300ms animation with `Curves.easeInOut`
- Only hides when scrolling down past toolbar height

### Back Navigation Solution
The original implementation used `Navigator.pop()` which caused black screens because ported features are embedded within HomePage, not separate routes. The solution:

1. **Page Constructor Updates**: Added `onBackPressed` parameter to all ported pages
2. **Callback Pattern**: HomePage passes callbacks that use `_onFeatureSelected(AppFeature.home)`
3. **Fallback Navigation**: If no callback provided, navigates to '/home' route

### SafeArea Integration
- Properly handles iPhone Dynamic Island and notches
- Uses `SafeArea` widget to respect system UI overlays
- Positioned as floating overlay with proper shadow

### Styling Consistency
- Matches home page floating navbar design
- Uses `AppColors.white` background with subtle shadow
- Primary color for icons and consistent typography
- Logo integration with proper spacing

## Dependencies
- `flutter/material.dart`
- `../theme/app_theme.dart` for colors and text styles
- Requires logo asset: `assets/images/logo_small.png`

## Integration Points

### HomePage Integration
```dart
// Pages with shared navbar
bool _hasOwnAppBar() {
  return [
    AppFeature.acurite,
    AppFeature.paragraphAnalyzer,
    AppFeature.teacherAssistant,
    AppFeature.studentAssistant,
    AppFeature.supportAssistant,
  ].contains(_currentFeature);
}

// Callback passing
AcuritePage(onBackPressed: () => _onFeatureSelected(AppFeature.home))
```

### Page Implementation Pattern
```dart
class FeaturePage extends StatefulWidget {
  final VoidCallback? onBackPressed;
  
  const FeaturePage({
    super.key,
    this.onBackPressed,
  });
}

// In build method
SharedNavbar(
  title: 'Feature Name',
  scrollController: _scrollController,
  showBackButton: true,
  onBackPressed: widget.onBackPressed,
)
```

## Testing & Validation
- Tested on iOS with Dynamic Island (proper SafeArea handling)
- Verified auto-hide functionality with various scroll patterns
- Confirmed back navigation works without black screens
- Validated consistent styling across all ported features

## Files Modified
- `app/lib/components/shared_navbar.dart` - Main component
- `app/lib/pages/home_page.dart` - Integration and callback passing
- `app/lib/pages/acurite_page.dart` - Updated constructor and usage
- `app/lib/pages/paragraph_analyzer_page.dart` - Updated constructor and usage
- `app/lib/pages/assistant_page.dart` - Updated constructor and usage

## Benefits

✅ **Consistent Design** - All ported features now have the same modern floating navbar  
✅ **Auto-Hide Functionality** - Smooth scroll-based navbar hiding for better UX  
✅ **Proper Navigation** - No more black screens when navigating back  
✅ **Maintainable Code** - Single component for all navbar needs  
✅ **Flexible Actions** - Support for custom action buttons per page  
✅ **SafeArea Support** - Proper handling of device notches and system UI  

## Future Enhancements
- Add support for custom navbar colors per feature
- Implement breadcrumb navigation for nested features
- Add support for subtitle text below the main title
- Consider adding search functionality to the navbar

## Change Log
- 2024-12-19: Initial implementation with auto-hide functionality
- 2024-12-19: Fixed black screen navigation issue with callback pattern
- 2024-12-19: Added SafeArea support for iPhone Dynamic Island
- 2024-12-19: Integrated across all ported features (Acurite, Paragraph Analyzer, Assistants)

## Related Documentation
- [App Sidebar System](app-sidebar.md) - Complementary navigation component
- [Acurite Implementation](acurite-implementation.md) - Feature using shared navbar
- [Authentication System](authentication-system.md) - User context in navbar 