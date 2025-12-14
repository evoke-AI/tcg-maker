import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'theme/app_theme.dart';
import 'pages/home_page.dart';
import 'pages/login_page.dart';
import 'providers/locale_provider.dart';
import 'l10n/app_localizations.dart';
import 'services/auth_service.dart';

// Global navigator key for navigation from anywhere in the app
final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

void main() async {
  // Ensure Flutter binding is initialized
  WidgetsFlutterBinding.ensureInitialized();
  
  // Set up global logout callback
  _setupGlobalLogoutCallback();
  
  // Set preferred orientations for better performance
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  
  // Set system UI overlay style
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );
  
  // Preload fonts for better rendering
  await AppTheme.preloadFonts();
  
  runApp(const NowledgeApp());
}

void _setupGlobalLogoutCallback() {
  // Set up global callback for when AuthService needs to navigate to login
  AuthService.setLogoutCallback(() {
    final navigator = navigatorKey.currentState;
    if (navigator != null) {
      // Navigate to login page and clear the entire navigation stack
      navigator.pushNamedAndRemoveUntil('/login', (route) => false);
    }
  });
}

class NowledgeApp extends StatelessWidget {
  const NowledgeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (context) => LocaleProvider()..initializeLocale(),
      child: Consumer<LocaleProvider>(
        builder: (context, localeProvider, child) {
          return MaterialApp(
            title: 'Nowledge',
            navigatorKey: navigatorKey,
            theme: AppTheme.getLightTheme(localeProvider.locale),
            locale: localeProvider.locale,
            localeResolutionCallback: (locale, supportedLocales) {
              // If no specific locale is set, try to match system locale
              if (localeProvider.locale == null) {
                if (locale != null) {
                  // Check if system locale is supported
                  for (final supportedLocale in supportedLocales) {
                    if (supportedLocale.languageCode == locale.languageCode) {
                      return supportedLocale;
                    }
                  }
                }
                // Fallback to English if system locale not supported
                return const Locale('en');
              }
              return localeProvider.locale;
            },
            supportedLocales: LocaleProvider.supportedLocales,
            localizationsDelegates: const [
              AppLocalizations.delegate,
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            home: const AuthWrapper(),
            routes: {
              '/login': (context) => const LoginPage(),
              '/home': (context) => const HomePage(),
            },
            debugShowCheckedModeBanner: false,
            // Performance optimizations
            builder: (context, child) {
              return MediaQuery(
                data: MediaQuery.of(context).copyWith(
                  textScaler: TextScaler.linear(
                    MediaQuery.of(context).textScaler.scale(1.0).clamp(0.8, 1.2),
                  ),
                ),
                child: child!,
              );
            },
          );
        },
      ),
    );
  }
}

class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  bool _isLoading = true;
  bool _isLoggedIn = false;
  bool _fontsLoaded = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _initializeApp();
  }

  Future<void> _initializeApp() async {
    try {
      // Initialize fonts and auth in parallel for better performance
      final results = await Future.wait([
        _ensureFontsLoaded(),
        AuthService.isLoggedIn(),
      ]);
      
      final fontsLoaded = results[0];
      final isLoggedIn = results[1];
      
      if (mounted) {
        setState(() {
          _fontsLoaded = fontsLoaded;
          _isLoggedIn = isLoggedIn;
          _isLoading = false;
          _error = null;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _error = e.toString();
        });
      }
    }
  }

  Future<bool> _ensureFontsLoaded() async {
    try {
      await AppTheme.preloadFonts();
      return true;
    } catch (e) {
      debugPrint('Font loading failed: $e');
      return false; // Continue with fallback fonts
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const CircularProgressIndicator(),
              const SizedBox(height: 16),
              Text(
                'Loading...',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              if (!_fontsLoaded) ...[
                const SizedBox(height: 8),
                Text(
                  'Preparing fonts...',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(context).textTheme.bodySmall?.color?.withValues(alpha: 0.7),
                  ),
                ),
              ],
            ],
          ),
        ),
      );
    }

    if (_error != null) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.error_outline,
                size: 64,
                color: Colors.red,
              ),
              const SizedBox(height: 16),
              Text(
                'Error loading app',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 8),
              Text(
                _error!,
                style: Theme.of(context).textTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  setState(() {
                    _isLoading = true;
                    _error = null;
                  });
                  _initializeApp();
                },
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    return _isLoggedIn ? const HomePage() : const LoginPage();
  }
}
