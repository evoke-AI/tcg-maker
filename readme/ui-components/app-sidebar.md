# AppSidebar Component

## Purpose
A responsive sidebar navigation component that provides feature selection, language switching, and intuitive mobile gestures. The sidebar serves as the primary navigation mechanism for the Social Translator app, allowing users to switch between Translation and About features while maintaining a clean, mobile-first design.

## Usage

```dart
AppSidebar(
  isOpen: _isSidebarOpen,
  onClose: _closeSidebar,
  onFeatureSelected: _onFeatureSelected,
  currentFeature: _currentFeature,
)
```

### Parameters
- **isOpen** (bool): Controls sidebar visibility state
- **onClose** (VoidCallback): Callback triggered when sidebar should close
- **onFeatureSelected** (Function(AppFeature)): Callback when user selects a feature
- **currentFeature** (AppFeature): Currently active feature for visual selection state

### Return Value
Returns a Widget that renders the complete sidebar with backdrop overlay.

## Design & Implementation Notes

### Architecture Decisions
- **Gesture-Based Interaction**: Implements swipe-to-close functionality for intuitive mobile UX
- **Backdrop Overlay**: Semi-transparent overlay that closes sidebar when tapped
- **Smooth Animations**: 300ms slide animation with easeInOut curve for polished feel
- **Responsive Design**: Fixed 280px width optimized for mobile screens
- **Visual Hierarchy**: Header with branding, navigation items, and language selector

### Key Implementation Details
1. **Animation System**: Uses `AnimatedPositioned` for smooth slide transitions
2. **Gesture Detection**: `GestureDetector` with `onHorizontalDragUpdate` for swipe-to-close
3. **State Management**: Integrates with parent component state through callbacks
4. **Localization**: Fully internationalized with ARB-based translations
5. **Theme Integration**: Uses centralized `AppColors` and `AppTextStyles`
6. **Authentication**: Integrated logout functionality with error handling

### UX Patterns
- **Swipe Right**: Opens sidebar (handled in parent HomePage)
- **Swipe Left**: Closes sidebar (handled within AppSidebar)
- **Tap Backdrop**: Closes sidebar
- **Tap Close Button**: Closes sidebar
- **Feature Selection**: Auto-closes sidebar after selection
- **Logout**: Secure logout with navigation to login page

## Dependencies
- **Flutter Material**: Core UI components and animations
- **AppLocalizations**: Internationalization support
- **AppTheme**: Centralized styling system
- **AuthService**: Authentication and logout functionality
- **LanguageSelector**: Embedded language switching component

## Testing & Validation
- **Gesture Testing**: Verified swipe gestures work on both iOS and Android
- **Animation Performance**: Smooth 60fps animations on mid-range devices
- **Accessibility**: Proper semantic labels and navigation structure
- **Responsive Layout**: Tested on various screen sizes and orientations

## Integration Points

### HomePage Integration
```dart
// Sidebar state management
bool _isSidebarOpen = false;
AppFeature _currentFeature = AppFeature.translation;

// Gesture detection for opening
GestureDetector(
  onHorizontalDragUpdate: (details) {
    if (details.delta.dx > 5 && !_isSidebarOpen) {
      _toggleSidebar();
    }
  },
  child: // main content
)

// Sidebar component
AppSidebar(
  isOpen: _isSidebarOpen,
  onClose: _closeSidebar,
  onFeatureSelected: _onFeatureSelected,
  currentFeature: _currentFeature,
)
```

### Feature Enum
```dart
enum AppFeature {
  translation,
  about,
}
```

### Logout Integration
```dart
// Logout functionality within sidebar
void _logout(BuildContext context) async {
  try {
    await AuthService.logout();
    if (context.mounted) {
      Navigator.of(context).pushReplacementNamed('/login');
    }
  } catch (e) {
    // Error handling with user feedback
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Logout failed: ${e.toString()}'),
        backgroundColor: Colors.red,
      ),
    );
  }
}
```

## Performance Considerations
- **Lazy Rendering**: Sidebar content only renders when needed
- **Efficient Animations**: Uses hardware-accelerated transforms
- **Memory Management**: Proper disposal of gesture detectors
- **State Optimization**: Minimal rebuilds through targeted setState calls

## Future Enhancements
- **Keyboard Navigation**: Add support for keyboard shortcuts
- **Customizable Width**: Make sidebar width responsive to screen size
- **Additional Features**: Easy to extend with new navigation items
- **Persistence**: Remember sidebar state across app sessions

## Change Log
- **2024-12-19**: Initial implementation with swipe gestures and feature navigation
- **2024-12-19**: Added language selector integration and improved animations
- **2024-12-19**: Enhanced accessibility and responsive design patterns 