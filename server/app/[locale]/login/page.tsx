import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import LoginClient from './LoginClient';

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  // Await the params object before accessing its properties
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'loginPage' });
  
  return {
    title: t('title'),
  };
}

export default function LoginPage() {
  return <LoginClient />;
} 