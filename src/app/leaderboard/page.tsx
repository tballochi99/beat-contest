import React from 'react';

export default function LeaderboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Leaderboard</h1>
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Rank</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Producer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Wins</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">1</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-white">Producer123</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">15</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">1250</td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">2</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-white">BeatMaster</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">12</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">1100</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
} 