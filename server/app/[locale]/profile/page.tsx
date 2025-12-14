import { requireAuthWithSignout } from '@/lib/authUtils';
import { getUserProfile } from '@/app/actions/profile';
import { getTranslations } from 'next-intl/server';
import ProfilePageClient from './ProfilePageClient';
import { redirect } from 'next/navigation';

export async function generateMetadata() {
  const t = await getTranslations('profile');
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function ProfilePage() {
  // Require authentication with automatic signout on invalid session
  await requireAuthWithSignout();

  // Fetch user profile
  const profileResponse = await getUserProfile();

  if (!profileResponse.success || !profileResponse.data) {
    console.error('Failed to fetch user profile:', profileResponse.error);
    redirect('/login');
  }

  const profile = profileResponse.data;
  
  // ✅ Only server-side translations for metadata and page header
  const t = await getTranslations('profile');

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 max-w-4xl">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-1 text-sm text-gray-600">{t('description')}</p>
        </div>
        
        {/* ✅ Client component handles its own translations */}
        <ProfilePageClient profile={profile} />
      </div>
    </div>
  );
} 