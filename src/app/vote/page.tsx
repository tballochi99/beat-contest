'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Contest {
  _id: string;
  title: string;
  theme: string;
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

export default function VotePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [contests, setContests] = useState<Contest[]>([]);
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  const [currentPair, setCurrentPair] = useState<[string, string] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votesRemaining, setVotesRemaining] = useState(3);
  const [votedPairs, setVotedPairs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }

    const fetchContests = async () => {
      try {
        const response = await fetch('/api/contests');
        if (!response.ok) throw new Error('Failed to fetch contests');
        const data = await response.json();
        setContests(data);
      } catch (err) {
        setError('Failed to load contests');
      } finally {
        setLoading(false);
      }
    };

    fetchContests();
  }, [session, router]);

  const generateNewPair = (contest: Contest) => {
    const userSubmissions = contest.submissions.filter(
      sub => sub.user._id === session?.user.id
    );
    const otherSubmissions = contest.submissions.filter(
      sub => sub.user._id !== session?.user.id
    );

    if (otherSubmissions.length < 2) {
      setError('Need at least 2 other submissions to vote');
      return null;
    }

    let pair: [string, string] | null = null;
    let attempts = 0;
    const maxAttempts = 10;

    while (!pair && attempts < maxAttempts) {
      const randomIndex1 = Math.floor(Math.random() * otherSubmissions.length);
      let randomIndex2 = Math.floor(Math.random() * otherSubmissions.length);
      
      while (randomIndex2 === randomIndex1) {
        randomIndex2 = Math.floor(Math.random() * otherSubmissions.length);
      }

      const submission1 = otherSubmissions[randomIndex1];
      const submission2 = otherSubmissions[randomIndex2];
      const pairKey = [submission1._id, submission2._id].sort().join('-');

      if (!votedPairs.has(pairKey)) {
        pair = [submission1._id, submission2._id];
      }

      attempts++;
    }

    if (!pair) {
      setError('No more pairs available to vote on');
      return null;
    }

    return pair;
  };

  const handleContestSelect = (contest: Contest) => {
    setSelectedContest(contest);
    setError(null);
    const newPair = generateNewPair(contest);
    setCurrentPair(newPair);
  };

  const handleVote = async (winnerId: string) => {
    if (!currentPair || !selectedContest) return;

    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contestId: selectedContest._id,
          winnerId,
          loserId: currentPair.find(id => id !== winnerId),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit vote');
      }

      setVotesRemaining(prev => prev - 1);
      const pairKey = currentPair.sort().join('-');
      setVotedPairs(prev => new Set([...prev, pairKey]));

      if (votesRemaining <= 1) {
        setError('You have used all your votes');
        return;
      }

      const newPair = generateNewPair(selectedContest);
      setCurrentPair(newPair);
    } catch (err) {
      setError('Failed to submit vote');
    }
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

  if (!session) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Vote</h1>

      {error && (
        <div className="bg-red-600 text-white p-4 rounded-lg mb-8">
          {error}
        </div>
      )}

      {!selectedContest ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {contests.map(contest => (
            <button
              key={contest._id}
              onClick={() => handleContestSelect(contest)}
              className="bg-gray-800 p-6 rounded-lg text-left hover:bg-gray-700 transition-colors"
            >
              <h2 className="text-xl font-semibold mb-2">{contest.title}</h2>
              <p className="text-gray-400 mb-4">{contest.theme}</p>
              <p className="text-sm text-gray-500">
                {contest.submissions.length} submissions
              </p>
            </button>
          ))}
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold">{selectedContest.title}</h2>
            <div className="text-purple-400">
              {votesRemaining} votes remaining
            </div>
          </div>

          {currentPair && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {currentPair.map(submissionId => {
                const submission = selectedContest.submissions.find(
                  sub => sub._id === submissionId
                );
                if (!submission) return null;

                return (
                  <div
                    key={submissionId}
                    className="bg-gray-800 p-6 rounded-lg text-center"
                  >
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <img
                        src={submission.user.avatar}
                        alt={submission.user.name}
                        className="w-12 h-12 rounded-full"
                      />
                      <span className="font-semibold">{submission.user.name}</span>
                    </div>
                    <audio
                      src={submission.trackUrl}
                      controls
                      className="w-full mb-4"
                    />
                    <button
                      onClick={() => handleVote(submissionId)}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md"
                    >
                      Vote for this track
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={() => setSelectedContest(null)}
            className="mt-8 text-purple-400 hover:text-purple-300"
          >
            ← Back to contests
          </button>
        </div>
      )}
    </div>
  );
} 