'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Beat {
  _id: string;
  url: string;
}

interface VotingDuelProps {
  beat1: Beat;
  beat2: Beat;
  contestId: string;
}

export default function VotingDuel({ beat1, beat2, contestId }: VotingDuelProps) {
  const router = useRouter();
  const [selectedBeat, setSelectedBeat] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audio1, setAudio1] = useState<HTMLAudioElement | null>(null);
  const [audio2, setAudio2] = useState<HTMLAudioElement | null>(null);

  const handleVote = async (beatId: string) => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          beat1Id: beat1._id,
          beat2Id: beat2._id,
          votedBeatId: beatId,
          contestId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit vote');
      }

      setSelectedBeat(beatId);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (beatId: string) => {
    if (audio1) audio1.pause();
    if (audio2) audio2.pause();

    const audio = new Audio(beatId === beat1._id ? beat1.url : beat2.url);
    audio.play();

    if (beatId === beat1._id) {
      setAudio1(audio);
    } else {
      setAudio2(audio);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Vote for Your Favorite Beat</h2>

      {error && (
        <div className="bg-red-500 text-white p-3 rounded-md text-sm mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Beat A</h3>
          <audio
            src={beat1.url}
            controls
            className="w-full"
            onPlay={() => handlePlay(beat1._id)}
          />
          <button
            onClick={() => handleVote(beat1._id)}
            disabled={loading || selectedBeat === beat1._id}
            className={`w-full py-2 px-4 rounded-md transition-colors ${
              selectedBeat === beat1._id
                ? 'bg-green-600 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700'
            } text-white font-bold disabled:opacity-50`}
          >
            {selectedBeat === beat1._id ? 'Voted' : 'Vote for Beat A'}
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Beat B</h3>
          <audio
            src={beat2.url}
            controls
            className="w-full"
            onPlay={() => handlePlay(beat2._id)}
          />
          <button
            onClick={() => handleVote(beat2._id)}
            disabled={loading || selectedBeat === beat2._id}
            className={`w-full py-2 px-4 rounded-md transition-colors ${
              selectedBeat === beat2._id
                ? 'bg-green-600 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700'
            } text-white font-bold disabled:opacity-50`}
          >
            {selectedBeat === beat2._id ? 'Voted' : 'Vote for Beat B'}
          </button>
        </div>
      </div>
    </div>
  );
} 