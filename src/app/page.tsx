import Link from 'next/link';
import CurrentContest from '@/components/CurrentContest';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-8">
          Welcome to Beat Contest
        </h1>
        <p className="text-xl mb-12 max-w-2xl mx-auto">
          Join the ultimate anonymous beat-making competition. Show your skills,
          compete with other producers, and win recognition.
        </p>
        
        <div className="space-y-4">
          <Link
            href="/auth/signin"
            className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
          >
            Sign In to Participate
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <CurrentContest />
        </div>

        <div className="space-y-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-300">
              Submit your beat anonymously, compete in daily rounds, and advance
              through the competition based on community votes.
            </p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Win Prizes</h2>
            <p className="text-gray-300">
              Top producers earn virtual trophies, recognition, and a spot in our
              Hall of Fame. Build your reputation in the community.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 