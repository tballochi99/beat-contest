'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Contest {
  _id: string;
  title: string;
  submissions: {
    _id: string;
    trackUrl: string;
    user: {
      _id: string;
    };
  }[];
}

interface VoteCount {
  contestId: string;
  count: number;
}

export default function VotePage() {
  const { data: session } = useSession();
  const [contests, setContests] = useState<Contest[]>([]);
  const [selectedContest, setSelectedContest] = useState<string>('');
  const [currentPair, setCurrentPair] = useState<{ beat1: string; beat2: string } | null>(null);
  const [voteCounts, setVoteCounts] = useState<VoteCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les concours actifs
  useEffect(() => {
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
  }, []);

  // Charger le nombre de votes restants
  useEffect(() => {
    const fetchVoteCounts = async () => {
      if (!session?.user) return;
      try {
        const response = await fetch('/api/votes/counts');
        if (!response.ok) throw new Error('Failed to fetch vote counts');
        const data = await response.json();
        setVoteCounts(data);
      } catch (err) {
        console.error('Error fetching vote counts:', err);
      }
    };

    fetchVoteCounts();
  }, [session]);

  // Générer une nouvelle paire de beats
  const generateNewPair = () => {
    if (!selectedContest) return;

    const contest = contests.find(c => c._id === selectedContest);
    if (!contest) return;

    const submissions = contest.submissions.filter(sub => sub.user._id !== session?.user?.id);
    if (submissions.length < 2) {
      setError('Not enough submissions to vote');
      return;
    }

    // Sélectionner deux soumissions aléatoires différentes
    const randomIndex1 = Math.floor(Math.random() * submissions.length);
    let randomIndex2 = Math.floor(Math.random() * submissions.length);
    while (randomIndex2 === randomIndex1) {
      randomIndex2 = Math.floor(Math.random() * submissions.length);
    }

    setCurrentPair({
      beat1: submissions[randomIndex1]._id,
      beat2: submissions[randomIndex2]._id
    });
  };

  // Soumettre un vote
  const handleVote = async (votedBeatId: string) => {
    if (!currentPair || !selectedContest) return;

    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contestId: selectedContest,
          beat1Id: currentPair.beat1,
          beat2Id: currentPair.beat2,
          votedBeatId,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit vote');

      // Mettre à jour le nombre de votes restants
      const updatedCounts = voteCounts.map(count => 
        count.contestId === selectedContest 
          ? { ...count, count: count.count - 1 }
          : count
      );
      setVoteCounts(updatedCounts);

      // Générer une nouvelle paire
      generateNewPair();
    } catch (err) {
      setError('Failed to submit vote');
    }
  };

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Voting System</h1>
        <p className="mb-4">Please sign in to participate in voting.</p>
        <Link
          href="/auth/signin"
          className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Vote for Your Favorite Beats</h1>

      {/* Sélection du concours */}
      <div className="mb-8">
        <label htmlFor="contest" className="block text-sm font-medium mb-2">
          Select Contest
        </label>
        <select
          id="contest"
          value={selectedContest}
          onChange={(e) => {
            setSelectedContest(e.target.value);
            setCurrentPair(null);
          }}
          className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-700"
        >
          <option value="">Choose a contest</option>
          {contests.map((contest) => {
            const voteCount = voteCounts.find(vc => vc.contestId === contest._id);
            return (
              <option 
                key={contest._id} 
                value={contest._id}
                disabled={voteCount?.count === 0}
              >
                {contest.title} ({voteCount ? `${voteCount.count}/10 votes left` : 'Loading...'})
              </option>
            );
          })}
        </select>
      </div>

      {/* Zone de vote */}
      {selectedContest && !currentPair && (
        <div className="text-center">
          <button
            onClick={generateNewPair}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg"
          >
            Start Voting
          </button>
        </div>
      )}

      {currentPair && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Beat A</h3>
            <audio
              src={`/api/beats/${currentPair.beat1}/stream`}
              controls
              className="w-full mb-4"
            />
            <button
              onClick={() => handleVote(currentPair.beat1)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md"
            >
              Vote for Beat A
            </button>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Beat B</h3>
            <audio
              src={`/api/beats/${currentPair.beat2}/stream`}
              controls
              className="w-full mb-4"
            />
            <button
              onClick={() => handleVote(currentPair.beat2)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md"
            >
              Vote for Beat B
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 