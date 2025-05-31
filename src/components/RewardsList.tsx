'use client';

import React from 'react';
import { useSession } from 'next-auth/react';

interface Reward {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'win' | 'achievement' | 'special';
}

export default function RewardsList() {
  const { data: session } = useSession();
  const [rewards, setRewards] = React.useState<Reward[]>([]);

  React.useEffect(() => {
    const fetchRewards = async () => {
      try {
        const response = await fetch('/api/user/rewards');
        if (response.ok) {
          const data = await response.json();
          setRewards(data);
        }
      } catch (error) {
        console.error('Error fetching rewards:', error);
      }
    };

    if (session?.user) {
      fetchRewards();
    }
  }, [session]);

  const getRewardIcon = (type: Reward['type']) => {
    switch (type) {
      case 'win':
        return '🏆';
      case 'achievement':
        return '⭐';
      case 'special':
        return '🎉';
      default:
        return '🏅';
    }
  };

  if (rewards.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No rewards yet. Start participating in contests to earn rewards!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rewards.map((reward) => (
        <div
          key={reward.id}
          className="bg-gray-700 rounded-lg p-4 flex items-start space-x-4"
        >
          <div className="text-2xl">{getRewardIcon(reward.type)}</div>
          <div>
            <h3 className="font-semibold text-white">{reward.title}</h3>
            <p className="text-sm text-gray-300">{reward.description}</p>
            <p className="text-xs text-gray-400 mt-1">{new Date(reward.date).toLocaleDateString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
} 