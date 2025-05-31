'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Contest {
  _id: string;
  title: string;
  description: string;
  theme: string;
  startDate: string;
  endDate: string;
  coverImage: string;
  rules: string;
  samplePack: string;
  status: 'draft' | 'active' | 'ended';
}

export default function AdminContestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [contests, setContests] = useState<Contest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Vérifier si l'utilisateur est admin
  useEffect(() => {
    console.log('Session:', session);
    console.log('Status:', status);
    console.log('User role:', session?.user?.role);
    
    if (status === 'loading') return;
    
    if (!session || session.user?.role !== 'admin') {
      console.log('Redirecting: Not admin');
      router.push('/');
    }
  }, [session, status, router]);

  // Charger les concours
  useEffect(() => {
    const fetchContests = async () => {
      try {
        const response = await fetch('/api/admin/contests');
        if (!response.ok) throw new Error('Failed to fetch contests');
        const data = await response.json();
        setContests(data);
      } catch (err) {
        setError('Error loading contests');
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.role === 'admin') {
      fetchContests();
    }
  }, [session]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!session || session.user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Manage Contests</h1>
        <button
          onClick={() => router.push('/admin/contests/new')}
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
        >
          Create New Contest
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contests.map((contest) => (
          <div key={contest._id} className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="relative h-48">
              <Image
                src={contest.coverImage}
                alt={contest.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="text-xl font-semibold mb-2">{contest.title}</h3>
              <p className="text-gray-300 text-sm mb-4">{contest.description}</p>
              <div className="flex justify-between items-center text-sm text-gray-400">
                <span>Theme: {contest.theme}</span>
                <span className={`px-2 py-1 rounded ${
                  contest.status === 'active' ? 'bg-green-500' :
                  contest.status === 'draft' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}>
                  {contest.status}
                </span>
              </div>
              <div className="mt-4 flex justify-between">
                <button
                  onClick={() => router.push(`/admin/contests/${contest._id}/edit`)}
                  className="text-purple-400 hover:text-purple-300"
                >
                  Edit
                </button>
                <button
                  onClick={() => router.push(`/admin/contests/${contest._id}`)}
                  className="text-purple-400 hover:text-purple-300"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 