'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Contest {
  _id: string;
  title: string;
  description: string;
  theme: string;
  startDate: string;
  endDate: string;
  coverImage: string;
  rules: string;
  status: string;
  createdBy: {
    name: string;
    avatar: string;
  };
}

export default function ContestsPage() {
  const { data: session } = useSession();
  const [contests, setContests] = useState<Contest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContests = async () => {
      try {
        const response = await fetch('/api/contests');
        if (!response.ok) {
          throw new Error('Failed to fetch contests');
        }
        const data = await response.json();
        setContests(data);
      } catch (err) {
        setError('Failed to load contests. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContests();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">Loading contests...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-red-500 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Active Contests</h1>

      {!session && (
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="text-center">
            <p className="text-gray-300 mb-4">Sign in to participate in contests</p>
            <Link 
              href="/auth/signin" 
              className="inline-block bg-purple-600 text-white py-2 px-6 rounded-md hover:bg-purple-700"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {contests.length === 0 ? (
          <div className="text-center text-gray-400">
            No active contests at the moment. Check back later!
          </div>
        ) : (
          contests.map((contest) => (
            <div key={contest._id} className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-start space-x-4">
                <img
                  src={contest.coverImage}
                  alt={contest.title}
                  className="w-32 h-32 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{contest.title}</h3>
                  <p className="text-gray-300 mb-4">{contest.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                      Theme: {contest.theme}
                    </div>
                    <Link
                      href={`/contests/${contest._id}`}
                      className="text-purple-400 hover:text-purple-300"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 