'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Contest {
  _id: string;
  title: string;
  theme: string;
  endDate: string;
  submissions: Array<{
    _id: string;
    user: {
      _id: string;
      name: string;
      avatar: string;
    };
    trackUrl: string;
  }>;
}

interface VoteStats {
  [submissionId: string]: number;
}

export default function LeaderboardPage() {
  const { data: session } = useSession();
  const [contests, setContests] = useState<Contest[]>([]);
  const [voteStats, setVoteStats] = useState<{[contestId: string]: VoteStats}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContests = async () => {
      try {
        const response = await fetch('/api/contests');
        if (!response.ok) throw new Error('Failed to fetch contests');
        const data = await response.json();
        setContests(data);

        // Fetch vote stats for each contest
        const statsPromises = data.map(async (contest: Contest) => {
          const statsResponse = await fetch(`/api/votes/stats?contestId=${contest._id}`);
          if (!statsResponse.ok) throw new Error('Failed to fetch vote stats');
          const stats = await statsResponse.json();
          return { contestId: contest._id, stats };
        });

        const statsResults = await Promise.all(statsPromises);
        const statsMap = statsResults.reduce((acc, { contestId, stats }) => {
          acc[contestId] = stats;
          return acc;
        }, {} as {[contestId: string]: VoteStats});

        setVoteStats(statsMap);
      } catch (err) {
        setError('Failed to load contests');
      } finally {
        setLoading(false);
      }
    };

    fetchContests();
  }, []);

  const isContestEnded = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  const getSubmissionVotes = (contestId: string, submissionId: string) => {
    return voteStats[contestId]?.[submissionId] || 0;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Leaderboard</h1>

      {error && (
        <div className="bg-red-600 text-white p-4 rounded-lg mb-8">
          {error}
        </div>
      )}

      <div className="space-y-8">
        {contests.map(contest => {
          const sortedSubmissions = [...contest.submissions].sort(
            (a, b) => getSubmissionVotes(contest._id, b._id) - getSubmissionVotes(contest._id, a._id)
          );
          const contestEnded = isContestEnded(contest.endDate);

          return (
            <div key={contest._id} className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-2xl font-semibold mb-2">{contest.title}</h2>
                <p className="text-gray-400">{contest.theme}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {contestEnded ? 'Contest ended' : 'Contest in progress'}
                </p>
              </div>

              <div className="divide-y divide-gray-700">
                {sortedSubmissions.map((submission, index) => (
                  <div key={submission._id} className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold text-purple-400 w-8">
                        #{index + 1}
                      </div>
                      <div>
                        {contestEnded ? (
                          <div className="flex items-center gap-3">
                            <img
                              src={submission.user.avatar}
                              alt={submission.user.name}
                              className="w-10 h-10 rounded-full"
                            />
                            <span className="font-semibold">{submission.user.name}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-700" />
                            <span className="font-semibold">Anonymous Producer</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-400">
                        {getSubmissionVotes(contest._id, submission._id)}
                      </div>
                      <div className="text-sm text-gray-400">votes</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 