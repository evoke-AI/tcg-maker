# Project Structure Overview

Below is a tree diagram of the main app structure (components, hooks, utilities, and key pages):

```
app/
├── layout.tsx (RootLayout)
├── page.tsx (RootPage)
├── navbar.tsx (Navbar)
├── HomeClient.tsx (HomeClient)
├── RootLayoutClient.tsx (RootLayoutClient)
├── globals.css (Global styles)
├── favicon.ico (Favicon)
├── hooks/
│   └── useSidebar.ts (useSidebar)
├── components/
│   ├── MainLayout.tsx (MainLayout)
│   ├── Sidebar.tsx (Sidebar)
│   └── LanguageSwitcher.tsx (LanguageSwitcher)
├── utils/
│   └── getFeatureTranslations.ts (getFeatureTranslations)
├── services/ (Service layer - placeholder)
├── fonts/ (Font assets - placeholder)
├── api/ (API routes - placeholder)
├── messages/ (multi-lingual translations)
│   ├── en.json
│   ├── zh-TW.json
│   ├── en/ (namespace: admin)
│   └── zh-TW/ (namespace: admin)
├── [locale]/
│   ├── layout.tsx (LocaleLayout)
│   ├── dashboard/ (user dashboard page)
│   ├── admin/ (the admin page)
├── actions/
│   └── admin/ (server actions for CRUD admin table)
components/
└── ui/
    ├── button.tsx (Button)
    ├── dialog.tsx (Dialog)
    ├── input.tsx (Input)
    ├── select.tsx (Select)
    └── dropdown-menu.tsx (DropdownMenu)
lib/
├── utils.ts (cn)
├── authUtils.ts (Authentication utilities)
├── permissions.ts (Permission logic)
├── prisma.ts (Prisma client setup)
└── auth.ts (NextAuth helpers)
```

---

## Component/Table Overview

| Name                | Location                                      | Purpose/Description                                                                                 | Related                          |
|---------------------|-----------------------------------------------|-----------------------------------------------------------------------------------------------------|-----------------------------------|
| MainLayout          | app/components/MainLayout.tsx                  | Consistent layout with sticky navbar and responsive sidebar                                         | Navbar, Sidebar, useSidebar       |
| Sidebar             | app/components/Sidebar.tsx                     | Responsive sidebar navigation, mobile gestures, admin/user links, language switcher                 | MainLayout, LanguageSwitcher      |
| LanguageSwitcher    | app/components/LanguageSwitcher.tsx            | Switches between supported languages, multiple UI variants                                          | Sidebar, Navbar, DropdownMenu     |
| Navbar              | app/navbar.tsx                                 | Top navigation bar with logo, sidebar toggle, user info, login/logout, language switcher            | MainLayout, LanguageSwitcher      |
| useSidebar          | app/hooks/useSidebar.ts                        | Manages sidebar open/close state and detects mobile/desktop layout                                  | MainLayout, Sidebar               |
| Button              | components/ui/button.tsx                       | Reusable button with variants and sizes, styled with Tailwind                                       | Sidebar, Navbar, LanguageSwitcher |
| Dialog              | components/ui/dialog.tsx                       | Modal dialog with overlay, content, header, footer, title/description                               | UserActions, Button               |
| Input               | components/ui/input.tsx                        | Reusable input field, styled with Tailwind                                                          | UserActions, CreateUserForm       |
| Select              | components/ui/select.tsx                       | Reusable select/dropdown, custom styling, item rendering                                            | UserActions, CreateUserForm       |
| DropdownMenu        | components/ui/dropdown-menu.tsx                | Dropdown menu for contextual menus and language selection                                           | LanguageSwitcher, Button          |
| cn                  | lib/utils.ts                                   | Utility to merge/deduplicate Tailwind CSS class names                                               | Button, Input, Select, Dialog     |
| authUtils           | lib/authUtils.ts                               | Authentication and permission helpers                                                               | NextAuth, getAdminDashboardData   |
| permissions         | lib/permissions.ts                             | Permission and role logic                                                                           | UserActions, AdminDashboardPage   |
| prisma              | lib/prisma.ts                                  | Prisma client instance                                                                              | All server actions                |
| auth                | lib/auth.ts                                    | NextAuth.js helpers and config                                                                      | NextAuth, Middleware              |
| getFeatureTranslations | app/utils/getFeatureTranslations.ts          | Fetches global and feature-specific translation functions for server components                      | AdminDashboardPage, DashboardPage |
| AdminDashboardPage  | app/[locale]/admin/page.tsx                    | Admin dashboard with user stats, system status, recent users                                        | getAdminDashboardData, UserActions|
| AdminUsersPage      | app/[locale]/admin/users/page.tsx              | Admin user management page, user list, loading/error states, integrates CreateUserForm/UserActions   | getUsers, CreateUserForm, UserActions |
| UserActions         | app/[locale]/admin/users/UserActions.tsx       | Edit, delete, enable actions for users in admin panel, dialogs, forms, server actions               | AdminUsersPage, Dialog, Button    |
| DashboardPage       | app/[locale]/dashboard/page.tsx                | User dashboard with personalized stats and overview                                                 | getTranslations                   |
| RootLayout          | app/layout.tsx                                 | Top-level layout, global styles and font, wraps all pages                                           | LocaleLayout                      |
| LocaleLayout        | app/[locale]/layout.tsx                        | Locale-specific layout, provides internationalization context                                       | RootLayout                        |
| RootPage            | app/page.tsx                                   | Root page, redirects to default locale, middleware handles detection                                | Middleware                        |
| Admin Actions       | app/actions/admin/                             | Server actions for admin features (user management, dashboard, roles, etc.)                         | AdminDashboardPage, AdminUsersPage, UserActions |