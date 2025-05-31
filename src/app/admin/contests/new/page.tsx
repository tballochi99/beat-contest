'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function NewContestPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title'),
      description: formData.get('description'),
      theme: formData.get('theme'),
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      coverImage: formData.get('coverImage'),
      rules: formData.get('rules'),
      status: formData.get('status'),
    };

    try {
      const response = await fetch('/api/admin/contests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create contest');
      }

      router.push('/admin/contests');
    } catch (err) {
      setError('Failed to create contest. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!session || session.user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Create New Contest</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-700"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={4}
            className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-700"
          />
        </div>

        <div>
          <label htmlFor="theme" className="block text-sm font-medium mb-2">
            Theme
          </label>
          <input
            type="text"
            id="theme"
            name="theme"
            required
            className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-700"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium mb-2">
              Start Date
            </label>
            <input
              type="datetime-local"
              id="startDate"
              name="startDate"
              required
              className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-700"
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium mb-2">
              End Date
            </label>
            <input
              type="datetime-local"
              id="endDate"
              name="endDate"
              required
              className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-700"
            />
          </div>
        </div>

        <div>
          <label htmlFor="coverImage" className="block text-sm font-medium mb-2">
            Cover Image URL
          </label>
          <input
            type="url"
            id="coverImage"
            name="coverImage"
            required
            className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-700"
          />
        </div>

        <div>
          <label htmlFor="rules" className="block text-sm font-medium mb-2">
            Rules
          </label>
          <textarea
            id="rules"
            name="rules"
            required
            rows={4}
            className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-700"
          />
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium mb-2">
            Status
          </label>
          <select
            id="status"
            name="status"
            required
            className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-700"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="ended">Ended</option>
          </select>
        </div>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create Contest'}
          </button>
        </div>
      </form>
    </div>
  );
} 