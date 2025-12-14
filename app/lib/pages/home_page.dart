import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../components/app_sidebar.dart';
import '../l10n/app_localizations.dart';
import 'translation_page.dart';
import 'about_page.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage>
    with SingleTickerProviderStateMixin {
  final ScrollController _scrollController = ScrollController();
  late AnimationController _appBarAnimationController;
  late Animation<Offset> _appBarOffsetAnimation;
  
  bool _isSidebarOpen = false;
  bool _isAppBarVisible = true;
  double _lastScrollOffset = 0;
  static const double _scrollThreshold = 10.0;
  AppFeature _currentFeature = AppFeature.translation;

  @override
  void initState() {
    super.initState();
    
    _appBarAnimationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    
    _appBarOffsetAnimation = Tween<Offset>(
      begin: Offset.zero,
      end: const Offset(0, -1),
    ).animate(CurvedAnimation(
      parent: _appBarAnimationController,
      curve: Curves.easeInOut,
    ));

    _scrollController.addListener(_onScroll);
  }

  void _onScroll() {
    final currentScrollOffset = _scrollController.offset;
    final difference = currentScrollOffset - _lastScrollOffset;

    if (difference.abs() > _scrollThreshold) {
      final shouldHide = difference > 0 && currentScrollOffset > kToolbarHeight;
      
      if (shouldHide && _isAppBarVisible) {
        _hideAppBar();
      } else if (!shouldHide && !_isAppBarVisible) {
        _showAppBar();
      }
      
      _lastScrollOffset = currentScrollOffset;
    }
  }

  void _hideAppBar() {
    if (_isAppBarVisible) {
      setState(() => _isAppBarVisible = false);
      _appBarAnimationController.forward();
    }
  }

  void _showAppBar() {
    if (!_isAppBarVisible) {
      setState(() => _isAppBarVisible = true);
      _appBarAnimationController.reverse();
    }
  }

  void _toggleSidebar() {
    setState(() {
      _isSidebarOpen = !_isSidebarOpen;
    });
  }

  void _closeSidebar() {
    setState(() {
      _isSidebarOpen = false;
    });
  }

  void _onFeatureSelected(AppFeature feature) {
    setState(() {
      _currentFeature = feature;
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _appBarAnimationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    
    return Scaffold(
      backgroundColor: AppColors.white,
      body: GestureDetector(
        onHorizontalDragUpdate: (details) {
          // Handle swipe to open sidebar
          if (details.delta.dx > 5 && !_isSidebarOpen) {
            _toggleSidebar();
          }
        },
        child: Stack(
          children: [
            // Main content - takes full screen
            SingleChildScrollView(
              controller: _scrollController,
              padding: EdgeInsets.only(
                top: kToolbarHeight + 24, // Add top padding for app bar
                left: 24,
                right: 24,
                bottom: 24,
              ),
              child: _buildCurrentPage(),
            ),
            
            // Floating app bar - overlays content
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: SlideTransition(
                position: _appBarOffsetAnimation,
                child: Container(
                  height: kToolbarHeight,
                  decoration: BoxDecoration(
                    color: AppColors.white,
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.black12,
                        offset: const Offset(0, 2),
                        blurRadius: 4,
                      ),
                    ],
                  ),
                  child: SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Row(
                        children: [
                          IconButton(
                            onPressed: _toggleSidebar,
                            icon: Icon(
                              Icons.menu,
                              color: AppColors.primary,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Image.asset(
                            'assets/images/logo_small.png',
                            height: 32,
                            fit: BoxFit.contain,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            l10n.appTitle,
                            style: AppTextStyles.heroTitle().copyWith(
                              fontWeight: FontWeight.bold,
                              color: AppColors.primary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
            
            // Sidebar
            AppSidebar(
              isOpen: _isSidebarOpen,
              onClose: _closeSidebar,
              onFeatureSelected: _onFeatureSelected,
              currentFeature: _currentFeature,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCurrentPage() {
    switch (_currentFeature) {
      case AppFeature.translation:
        return const TranslationPage();
      case AppFeature.about:
        return const AboutPage();
    }
  }
} 