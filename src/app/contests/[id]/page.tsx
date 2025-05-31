'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
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
  submissions: Array<{
    user: {
      _id: string;
      name: string;
      avatar: string;
    };
    trackUrl: string;
    submittedAt: string;
    votes: Array<{
      user: string;
      score: number;
      votedAt: string;
    }>;
  }>;
}

export default function ContestDetailPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const [contest, setContest] = useState<Contest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchContest = async () => {
      try {
        const response = await fetch(`/api/contests/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch contest');
        }
        const data = await response.json();
        setContest(data);
      } catch (err) {
        setError('Failed to load contest details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContest();
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'audio/mpeg' && file.type !== 'audio/wav') {
        setError('Please upload an MP3 or WAV file');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('contestId', id as string);

      const response = await fetch('/api/submissions', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to submit track');
      }

      // Réinitialiser le formulaire après une soumission réussie
      setSelectedFile(null);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      // Rafraîchir les détails du concours
      const updatedContest = await fetch(`/api/contests/${id}`).then(res => res.json());
      setContest(updatedContest);
    } catch (err) {
      setError('Failed to submit track. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">Loading contest details...</div>
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-red-500 text-center">{error || 'Contest not found'}</div>
      </div>
    );
  }

  const hasSubmitted = session && contest.submissions.some(
    submission => submission.user._id === session.user.id
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href="/contests"
        className="text-purple-400 hover:text-purple-300 mb-6 inline-block"
      >
        ← Back to Contests
      </Link>

      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <div className="flex items-start space-x-6">
          <img
            src={contest.coverImage}
            alt={contest.title}
            className="w-48 h-48 object-cover rounded-lg"
          />
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-4">{contest.title}</h1>
            <p className="text-gray-300 mb-4">{contest.description}</p>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
              <div>
                <span className="font-medium">Theme:</span> {contest.theme}
              </div>
              <div>
                <span className="font-medium">Created by:</span> {contest.createdBy.name}
              </div>
              <div>
                <span className="font-medium">Start Date:</span>{' '}
                {new Date(contest.startDate).toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium">End Date:</span>{' '}
                {new Date(contest.endDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Rules</h2>
        <div className="prose prose-invert max-w-none">
          {contest.rules.split('\n').map((rule, index) => (
            <p key={index} className="text-gray-300 mb-2">
              {rule}
            </p>
          ))}
        </div>
      </div>

      {session ? (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Submit Your Track</h2>
          {hasSubmitted ? (
            <div className="text-center text-gray-300">
              You have already submitted a track for this contest.
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select your track (MP3 or WAV)
                </label>
                <input
                  type="file"
                  accept=".mp3,.wav"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-300
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-purple-600 file:text-white
                    hover:file:bg-purple-700
                    cursor-pointer"
                />
              </div>

              {error && (
                <div className="text-red-400 text-sm">{error}</div>
              )}

              {selectedFile && (
                <div className="text-sm text-gray-300">
                  Selected file: {selectedFile.name}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={!selectedFile || isUploading}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Submitting...' : 'Submit Track'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="text-center">
            <p className="text-gray-300 mb-4">Sign in to submit your track</p>
            <Link
              href="/auth/signin"
              className="inline-block bg-purple-600 text-white py-2 px-6 rounded-md hover:bg-purple-700"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}

      <div className="bg-gray-800 rounded-lg p-6 mt-8">
        <h2 className="text-xl font-semibold mb-4">Submissions</h2>
        {contest.submissions.length === 0 ? (
          <div className="text-center text-gray-400">
            No submissions yet. Be the first to submit!
          </div>
        ) : (
          <div className="space-y-4">
            {contest.submissions.map((submission) => (
              <div key={submission._id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={submission.user.avatar}
                      alt={submission.user.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <div className="font-medium">{submission.user.name}</div>
                      <div className="text-sm text-gray-400">
                        Submitted on {new Date(submission.submittedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <audio controls className="w-64">
                    <source src={submission.trackUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 