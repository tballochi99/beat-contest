'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import AuthGuard from '@/components/AuthGuard';

export default function ContestsPage() {
  const { data: session } = useSession();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      // Réinitialiser le formulaire après un upload réussi
      setSelectedFile(null);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (err) {
      setError('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Active Contests</h1>

      {session ? (
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload Your Track</h2>
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
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : 'Upload Track'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="text-center">
            <p className="text-gray-300 mb-4">Sign in to upload your track and participate in contests</p>
            <a 
              href="/auth/signin" 
              className="inline-block bg-purple-600 text-white py-2 px-6 rounded-md hover:bg-purple-700"
            >
              Sign In
            </a>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Liste des concours actifs */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Current Contest</h3>
          <div className="space-y-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium">Hip Hop Beat Contest</h4>
              <p className="text-sm text-gray-300 mt-2">
                Create a hip hop beat using the provided sample pack.
              </p>
              <div className="mt-4 flex justify-between items-center">
                <span className="text-sm text-gray-400">Ends in 3 days</span>
                <button className="text-purple-400 hover:text-purple-300 text-sm">
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Classement */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Leaderboard</h3>
          <div className="space-y-2">
            {[1, 2, 3].map((position) => (
              <div key={position} className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <span className="text-gray-400">#{position}</span>
                  <span className="font-medium">Producer {position}</span>
                </div>
                <span className="text-purple-400">{100 - (position * 10)} points</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 