'use client';

import PersonalInfoSection from './components/PersonalInfoSection';
import SchoolMembershipsSection from './components/SchoolMembershipsSection';
import SecuritySection from './components/SecuritySection';
import type { UserProfile } from './types';

interface ProfilePageClientProps {
  profile: UserProfile;
}

export default function ProfilePageClient({ profile }: ProfilePageClientProps) {
  return (
    <div className="space-y-6">
      {/* Personal Information Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <PersonalInfoSection profile={profile} />
      </div>

      {/* School Memberships Section */}
      {profile.schools.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <SchoolMembershipsSection schools={profile.schools} />
        </div>
      )}

      {/* Security Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <SecuritySection />
      </div>
    </div>
  );
} 