import { notFound } from 'next/navigation';
import { locales } from '@/i18n/routing';

// Import components and stylesheets from parent 
import RootLayoutClient from '../RootLayoutClient';
import ClientIntlProvider from './ClientIntlProvider';

// Define props type for the layout component
type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }> & { locale: string };
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  // Await and extract the locale parameter
  const { locale } = await params;
  
  // Validate that the locale parameter is valid
  if (!locales.includes(locale as typeof locales[number])) {
    notFound();
  }

  return (
    <ClientIntlProvider locale={locale}>
      <RootLayoutClient>{children}</RootLayoutClient>
    </ClientIntlProvider>
  );
} 