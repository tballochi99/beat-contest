'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [isLoading, setIsLoading] = useState(true);
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
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const EXTRACT_DURATION = 60; // 1 minute in seconds - FIXED

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

  useEffect(() => {
    // Cleanup object URL when component unmounts or file changes
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

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

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p>Loading contest details...</p>
        </div>
      </div>
    );
  }

  if (error && !contest) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-red-500 text-center bg-red-100 border border-red-400 rounded-lg p-4">
          {error || 'Contest not found'}
        </div>
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

      {/* Contest Header */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8 shadow-lg">
        <div className="flex items-start space-x-6">
          <img
            src={contest.coverImage}
            alt={contest.title}
            className="w-48 h-48 object-cover rounded-lg shadow-md"
          />
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-4 text-white">{contest.title}</h1>
            <p className="text-gray-300 mb-6 text-lg">{contest.description}</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-700 rounded-lg p-3">
                <span className="font-medium text-purple-400">Theme:</span>
                <p className="text-white mt-1">{contest.theme}</p>
              </div>
              <div className="bg-gray-700 rounded-lg p-3">
                <span className="font-medium text-purple-400">Created by:</span>
                <p className="text-white mt-1">{contest.createdBy.name}</p>
              </div>
              <div className="bg-gray-700 rounded-lg p-3">
                <span className="font-medium text-purple-400">Start Date:</span>
                <p className="text-white mt-1">{new Date(contest.startDate).toLocaleDateString()}</p>
              </div>
              <div className="bg-gray-700 rounded-lg p-3">
                <span className="font-medium text-purple-400">End Date:</span>
                <p className="text-white mt-1">{new Date(contest.endDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rules Section */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8 shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
          <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Contest Rules
        </h2>
        <div className="bg-gray-700 rounded-lg p-4">
          {contest.rules.split('\n').map((rule, index) => (
            <p key={index} className="text-gray-300 mb-2 last:mb-0">
              {rule}
            </p>
          ))}
        </div>
      </div>

      {/* Submission Form */}
      {session && !hasSubmitted ? (
        <div className="bg-gray-800 p-6 rounded-lg mb-8 shadow-lg">
          <h2 className="text-xl font-bold mb-6 text-white flex items-center">
            <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Submit Your Track
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload */}
            <div>
              <label htmlFor="track" className="block text-sm font-medium mb-3 text-white">
                Select your audio file
              </label>
              <div className="relative">
                <input
                  type="file"
                  id="track"
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-300 bg-gray-700 border border-gray-600 rounded-lg cursor-pointer
                    file:mr-4 file:py-3 file:px-6 file:rounded-l-lg file:border-0
                    file:text-sm file:font-semibold file:bg-purple-600 file:text-white
                    hover:file:bg-purple-700 file:cursor-pointer transition-colors"
                  required
                />
              </div>
            </div>

            {/* Audio Preview and Selection */}
            {audioUrl && duration > 0 && (
              <div className="space-y-6 bg-gray-700 rounded-lg p-6">
                <div>
                  <h3 className="text-lg font-medium mb-4 text-white">Choose Your Extract</h3>
                  
                  {/* Audio Player */}
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onLoadedMetadata={handleLoadedMetadata}
                    onTimeUpdate={handleTimeUpdate}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    className="w-full mb-4 rounded-lg"
                    controls
                  />
                  
                  {/* Custom Timeline */}
                  <div className="space-y-4">
                    <div
                      ref={timelineRef}
                      className="relative h-16 bg-gray-600 rounded-lg cursor-pointer select-none shadow-inner"
                      onMouseDown={handleTimelineMouseDown}
                    >
                      {/* Full track background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-600 to-gray-500 rounded-lg"></div>
                      
                      {/* Current playback position */}
                      <div
                        className="absolute top-0 w-1 h-full bg-white shadow-lg z-20 rounded-full"
                        style={{ left: `${getTimelinePosition(currentTime)}%` }}
                      />
                      
                      {/* Extract selection */}
                      <div
                        className="absolute top-2 bottom-2 bg-gradient-to-r from-purple-500 to-purple-400 rounded-md shadow-lg border-2 border-purple-300"
                        style={{
                          left: `${getTimelinePosition(extractStart)}%`,
                          width: `${getTimelinePosition(extractEnd) - getTimelinePosition(extractStart)}%`
                        }}
                      >
                        {/* Selection handles */}
                        <div className="absolute inset-y-0 left-0 w-2 bg-white bg-opacity-50 rounded-l-md cursor-ew-resize" />
                        <div className="absolute inset-y-0 right-0 w-2 bg-white bg-opacity-50 rounded-r-md cursor-ew-resize" />
                      </div>
                      
                      {/* Time labels */}
                      <div className="absolute inset-0 flex items-center justify-between px-2 text-xs font-mono text-white pointer-events-none">
                        <span className="bg-black bg-opacity-50 px-2 py-1 rounded">0:00</span>
                        <span className="bg-black bg-opacity-50 px-2 py-1 rounded">{formatTime(duration)}</span>
                      </div>
                    </div>
                    
                    {/* Extract Info */}
                    <div className="flex items-center justify-between bg-gray-600 rounded-lg p-4">
                      <div className="text-sm space-y-1">
                        <div className="text-white">
                          <strong>Selected Extract:</strong> {formatTime(extractStart)} - {formatTime(extractEnd)}
                        </div>
                        <div className="text-gray-300">
                          <strong>Duration:</strong> {formatTime(extractEnd - extractStart)}
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={isPlaying && isPreviewMode ? stopPreview : playPreview}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                      >
                        {isPlaying && isPreviewMode ? (
                          <>
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                            </svg>
                            <span>Stop Preview</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                            <span>Preview Extract</span>
                          </>
                        )}
                      </button>
                    </div>
                    
                    {/* Instructions */}
                    <div className="text-sm text-gray-400 bg-gray-600 rounded-lg p-3">
                      <h4 className="font-medium text-white mb-2">How to select your extract:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Click and drag on the timeline to select your extract</li>
                        <li>Use the preview button to test your selection</li>
                        <li>You can select any duration you want</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !selectedFile || !audioUrl || (duration > 0 && duration < EXTRACT_DURATION)}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 
                text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed 
                transition-all duration-200 flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>Submit Track</span>
                </>
              )}
            </button>
            
            {/* Messages */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}
          </form>
        </div>
      ) : session && hasSubmitted ? (
        <div className="bg-gray-800 rounded-lg p-6 mb-8 shadow-lg">
          <div className="text-center">
            <div className="text-green-400 text-5xl mb-4">✓</div>
            <h3 className="text-xl font-semibold text-white mb-2">Track Submitted</h3>
            <p className="text-gray-300 mb-4">You have already submitted a track for this contest.</p>
            <button
              onClick={handleDeleteSubmission}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2 mx-auto"
            >
              {deleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Delete Submission</span>
                </>
              )}
            </button>
            <p className="text-sm text-gray-400 mt-2">
              Warning: Deleting your submission will prevent you from submitting again
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg p-6 mb-8 shadow-lg">
          <div className="text-center">
            <svg className="w-12 h-12 text-purple-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h3 className="text-xl font-semibold text-white mb-2">Sign in Required</h3>
            <p className="text-gray-300 mb-4">Sign in to submit your track to this contest</p>
            <Link
              href="/auth/signin"
              className="inline-block bg-gradient-to-r from-purple-600 to-purple-700 text-white py-2 px-6 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}

      {/* Submissions List */}
      <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-6 text-white flex items-center">
          <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          Submissions ({contest.submissions.length})
        </h2>
        
        {contest.submissions.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <p className="text-gray-400 text-lg">No submissions yet</p>
            <p className="text-gray-500">Be the first to submit your track!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {contest.submissions.map((submission) => (
              <div key={submission._id} className="bg-gray-700 rounded-lg p-6 hover:bg-gray-650 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img
                      src={submission.user.avatar}
                      alt={submission.user.name}
                      className="w-12 h-12 rounded-full border-2 border-purple-400"
                    />
                    <div>
                      <div className="font-medium text-white text-lg">{submission.user.name}</div>
                      <div className="text-sm text-gray-400">
                        Submitted on {new Date(submission.submittedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-600 rounded-lg p-2">
                    <audio controls className="w-80">
                      <source src={submission.trackUrl} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}