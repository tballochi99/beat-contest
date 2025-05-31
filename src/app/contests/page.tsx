'use client';

import React, { useState, useRef } from 'react';
import { checkAudioDuration, extractRandomMinute } from '@/lib/audioUtils';

export default function ContestsPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('audio/')) {
        setIsProcessing(true);
        try {
          // On extrait une minute aléatoire du fichier
          const processedFile = await extractRandomMinute(file);
          setSelectedFile(processedFile as File);
          const url = URL.createObjectURL(processedFile);
          setAudioUrl(url);
          setError(null);
        } catch (error) {
          setError('Error processing audio file');
          setSelectedFile(null);
          setAudioUrl(null);
        } finally {
          setIsProcessing(false);
        }
      } else {
        setError('Please select an audio file');
        setSelectedFile(null);
        setAudioUrl(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    try {
      // Here you would typically upload to your server
      // For now, we'll just simulate a successful upload
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Production uploaded successfully!');
      // Reset the form
      setSelectedFile(null);
      setAudioUrl(null);
    } catch (error) {
      alert('Error uploading production');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Active Contests</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-2">Weekly Beat Battle</h2>
          <p className="text-gray-400 mb-4">Create a beat using only these samples...</p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Upload your production (will be automatically trimmed to 1 minute)
            </label>
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileSelect}
              disabled={isProcessing}
              className={`block w-full text-sm text-gray-300
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-purple-600 file:text-white
                hover:file:bg-purple-700
                ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            {error && (
              <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
            {isProcessing && (
              <p className="mt-2 text-sm text-purple-500">Processing your audio...</p>
            )}
          </div>

          {audioUrl && (
            <div className="mb-4">
              <audio
                ref={audioRef}
                controls
                className="w-full"
                src={audioUrl}
              >
                Your browser does not support the audio element.
              </audio>
              <p className="mt-2 text-sm text-gray-400">
                Preview of your 1-minute submission
              </p>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Ends in: 3 days</span>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading || isProcessing}
              className={`${
                !selectedFile || isUploading || isProcessing
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
              } text-white px-4 py-2 rounded-md text-sm transition-colors`}
            >
              {isUploading ? 'Uploading...' : 'Submit Production'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 