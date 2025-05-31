'use client';

import { useEffect, useState } from 'react';
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

export default function CurrentContest() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
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
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchContests();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        Error: {error}
      </div>
    );
  }

  if (contests.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 mb-4">No active contests at the moment</p>
        <Link
          href="/contests"
          className="text-purple-500 hover:text-purple-400"
        >
          View upcoming contests
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Active Contests</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {contests.map((contest) => (
          <Link
            key={contest._id}
            href={`/contests/${contest._id}`}
            className="group bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors"
          >
            <div className="relative h-48">
              <img
                src={contest.coverImage}
                alt={contest.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
            <div className="p-4">
              <h3 className="text-xl font-semibold mb-2 group-hover:text-purple-400 transition-colors">
                {contest.title}
              </h3>
              <p className="text-gray-300 text-sm line-clamp-2">
                {contest.description}
              </p>
              <div className="mt-2 text-sm text-gray-400">
                Theme: {contest.theme}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 