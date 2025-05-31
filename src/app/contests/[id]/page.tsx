'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

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
    _id: string;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [extractStart, setExtractStart] = useState<number>(0);
  const [extractEnd, setExtractEnd] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [voteStats, setVoteStats] = useState<{[key: string]: number}>({});
  const [timeLeft, setTimeLeft] = useState<string>('');
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const EXTRACT_DURATION = 60; // 1 minute in seconds - FIXED

  useEffect(() => {
    const fetchContest = async () => {
      try {
        const response = await fetch(`/api/contests/${id}`);
        if (!response.ok) throw new Error('Failed to fetch contest');
        const data = await response.json();
        setContest(data);
      } catch (err) {
        setError('Failed to load contest');
      } finally {
        setLoading(false);
      }
    };

    const fetchVoteStats = async () => {
      try {
        const response = await fetch(`/api/votes/stats?contestId=${id}`);
        if (!response.ok) throw new Error('Failed to fetch vote stats');
        const data = await response.json();
        setVoteStats(data);
      } catch (err) {
        console.error('Error fetching vote stats:', err);
      }
    };

    fetchContest();
    fetchVoteStats();
  }, [id]);

  useEffect(() => {
    // Cleanup object URL when component unmounts or file changes
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Mettre à jour le compte à rebours
  useEffect(() => {
    if (!contest) return;

    const updateCountdown = () => {
      const endDate = new Date(contest.endDate).getTime();
      const now = new Date().getTime();
      const distance = endDate - now;

      if (distance < 0) {
        setTimeLeft('Concours terminé');
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${days}j ${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [contest]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        setError('Please upload a valid audio file');
        return;
      }
      
      // Cleanup previous URL
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      
      setSelectedFile(file);
      setError(null);
      setSuccess(null);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setExtractStart(0);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const audioDuration = audioRef.current.duration;
      setDuration(audioDuration);
      setExtractEnd(audioDuration);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      setCurrentTime(time);
      
      // Stop at extract end during preview mode (exactly 1 minute)
      if (isPreviewMode && time >= extractStart + EXTRACT_DURATION) {
        audioRef.current.pause();
        setIsPlaying(false);
        setIsPreviewMode(false);
      }
    }
  };

  const getTimelinePosition = (time: number): number => {
    return duration > 0 ? (time / duration) * 100 : 0;
  };

  const getTimeFromPosition = (clientX: number): number => {
    if (!timelineRef.current) return 0;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const position = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(duration, position * duration));
  };

  const handleTimelineMouseDown = (e: React.MouseEvent) => {
    if (!duration) return;
    
    const clickTime = getTimeFromPosition(e.clientX);
    setExtractStart(clickTime);
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !duration) return;
    
    const clickTime = getTimeFromPosition(e.clientX);
    setExtractEnd(clickTime);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    // S'assurer que start est toujours avant end
    if (extractStart > extractEnd) {
      const temp = extractStart;
      setExtractStart(extractEnd);
      setExtractEnd(temp);
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, extractStart, duration]);

  const playPreview = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = extractStart;
      audioRef.current.play();
      setIsPlaying(true);
      setIsPreviewMode(true);
    }
  };

  const stopPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsPreviewMode(false);
    }
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedFile || !audioUrl) {
      setError('Please select an audio file');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('contestId', id as string);
      formData.append('extractStart', extractStart.toString());
      formData.append('extractEnd', extractEnd.toString());

      const response = await fetch('/api/submissions/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit track');
      }

      const submission = await response.json();
      
      setContest(prev => prev ? {
        ...prev,
        submissions: [...prev.submissions, submission],
      } : null);
      
      setSelectedFile(null);
      setAudioUrl(null);
      setExtractStart(0);
      setExtractEnd(0);
      setSuccess('Track submitted successfully!');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit track');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubmission = async () => {
    if (!session || !contest) return;
    
    const userSubmission = contest.submissions.find(
      submission => submission.user._id === session.user.id
    );
    
    if (!userSubmission) return;

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/submissions/${userSubmission._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete submission');
      }

      setContest(prev => prev ? {
        ...prev,
        submissions: prev.submissions.filter(s => s._id !== userSubmission._id),
      } : null);

      setSuccess('Your submission has been deleted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete submission');
    } finally {
      setDeleting(false);
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

  if (error && !contest) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">Contest not found</div>
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
        className="text-purple-400 hover:text-purple-300 mb-6 inline-flex items-center space-x-2 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span>Back to Contests</span>
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{contest.title}</h1>
        <div className="flex items-center gap-4 text-gray-400 mb-4">
          <span>Created by {contest.createdBy.name}</span>
          <span>•</span>
          <span>{contest.submissions.length} Submissions</span>
          <span>•</span>
          <span className="text-purple-400 font-medium">{timeLeft}</span>
        </div>
        <p className="text-gray-300">{contest.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Contest Details</h2>
          <div className="bg-gray-800 p-6 rounded-lg">
            <p className="mb-2"><strong>Theme:</strong> {contest.theme}</p>
            <p className="mb-2"><strong>Start Date:</strong> {new Date(contest.startDate).toLocaleDateString()}</p>
            <p className="mb-2"><strong>End Date:</strong> {new Date(contest.endDate).toLocaleDateString()}</p>
            <p className="mb-2"><strong>Status:</strong> {contest.status}</p>
            <p className="mb-2"><strong>Total Submissions:</strong> {contest.submissions.length}</p>
            <p className="mb-2"><strong>Total Votes:</strong> {Object.values(voteStats).reduce((a, b) => a + b, 0)}</p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Rules</h2>
          <div className="bg-gray-800 p-6 rounded-lg">
            <p className="whitespace-pre-wrap">{contest.rules}</p>
          </div>
        </div>
      </div>

      {session && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Votre soumission</h2>
          {contest.submissions.find(sub => sub.user._id === session.user.id) ? (
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={contest.submissions.find(sub => sub.user._id === session.user.id)?.user.avatar}
                  alt="User avatar"
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="font-semibold">{contest.submissions.find(sub => sub.user._id === session.user.id)?.user.name}</p>
                  <p className="text-sm text-gray-400">
                    Soumis le {new Date(contest.submissions.find(sub => sub.user._id === session.user.id)?.submittedAt || '').toLocaleDateString()}
                  </p>
                </div>
              </div>
              <audio
                src={contest.submissions.find(sub => sub.user._id === session.user.id)?.trackUrl}
                controls
                className="w-full mb-4"
              />
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-purple-400">
                  {voteStats[contest.submissions.find(sub => sub.user._id === session.user.id)?._id || ''] || 0}
                </p>
                <p className="text-sm text-gray-400">Votes received</p>
              </div>
              <button
                onClick={handleDeleteSubmission}
                disabled={deleting}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md"
              >
                {deleting ? 'Deleting...' : 'Delete Submission'}
              </button>
            </div>
          ) : (
            <div className="bg-gray-800 p-6 rounded-lg">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Upload Your Track
                  </label>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600"
                  />
                </div>

                {audioUrl && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Select 1-Minute Extract
                      </label>
                      <div
                        ref={timelineRef}
                        className="relative h-8 bg-gray-700 rounded-md cursor-pointer"
                        onMouseDown={handleTimelineMouseDown}
                      >
                        <div
                          className="absolute h-full bg-purple-600"
                          style={{
                            left: `${getTimelinePosition(extractStart)}%`,
                            width: `${getTimelinePosition(extractEnd) - getTimelinePosition(extractStart)}%`,
                          }}
                        />
                        <div
                          className="absolute top-0 bottom-0 w-1 bg-white"
                          style={{ left: `${getTimelinePosition(currentTime)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm text-gray-400 mt-1">
                        <span>{formatTime(extractStart)}</span>
                        <span>{formatTime(extractEnd)}</span>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={playPreview}
                        disabled={isPlaying}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md"
                      >
                        Preview Extract
                      </button>
                      <button
                        type="button"
                        onClick={stopPreview}
                        disabled={!isPlaying}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md"
                      >
                        Stop
                      </button>
                    </div>

                    <audio
                      ref={audioRef}
                      src={audioUrl}
                      onLoadedMetadata={handleLoadedMetadata}
                      onTimeUpdate={handleTimeUpdate}
                      className="hidden"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !selectedFile}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Track'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {success && (
        <div className="bg-green-600 text-white p-4 rounded-lg mb-8">
          {success}
        </div>
      )}

    </div>
  );
}