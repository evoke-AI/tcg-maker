import { getTranslations } from 'next-intl/server';
import AdminUsersPageClient from './AdminUsersPageClient';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin' });
  return { 
    title: t('users.title') || 'User Management'
  };
}

export default function AdminUsersPage() {
  return <AdminUsersPageClient />;
} 