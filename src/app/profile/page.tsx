import React from 'react';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import ProfileForm from '@/components/ProfileForm';
import RewardsList from '@/components/RewardsList';

export default async function ProfilePage() {
  const session = await getServerSession();

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Section Profil */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-semibold mb-6">Profile Information</h2>
            <ProfileForm />
          </div>
        </div>

        {/* Section Récompenses */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-semibold mb-6">My Rewards</h2>
            <RewardsList />
          </div>
        </div>
      </div>
    </div>
  );
} 