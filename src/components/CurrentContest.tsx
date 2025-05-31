'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Contest {
  _id: string;
  themeArtist: string;
  startDate: string;
  endDate: string;
  currentRound: number;
  status: string;
}

export default function CurrentContest() {
  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContest = async () => {
      try {
        const response = await fetch('/api/contests/current');
        if (!response.ok) {
          throw new Error('Failed to fetch contest');
        }
        const data = await response.json();
        setContest(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchContest();
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

  if (!contest) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 mb-4">No active contest at the moment</p>
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
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Current Contest</h2>
      <div className="space-y-4">
        <div>
          <p className="text-gray-400">Theme Artist</p>
          <p className="text-xl font-semibold">{contest.themeArtist}</p>
        </div>
        <div>
          <p className="text-gray-400">Current Round</p>
          <p className="text-xl font-semibold">Round {contest.currentRound}</p>
        </div>
        <div>
          <p className="text-gray-400">Time Remaining</p>
          <p className="text-xl font-semibold">
            {new Date(contest.endDate).toLocaleDateString()}
          </p>
        </div>
        <Link
          href={`/contests/${contest._id}`}
          className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
        >
          View Details
        </Link>
      </div>
    </div>
  );
} 