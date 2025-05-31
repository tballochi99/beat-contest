import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import Vote from '@/models/Vote';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Récupérer tous les votes de l'utilisateur
    const votes = await Vote.find({ voter: session.user.id });

    // Compter les votes par concours
    const voteCounts = votes.reduce((acc, vote) => {
      const contestId = vote.contest.toString();
      acc[contestId] = (acc[contestId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Transformer en tableau avec le nombre de votes restants
    const result = Object.entries(voteCounts).map(entry => {
      const [contestId, count] = entry;
      return {
        contestId,
        count: Math.max(0, 10 - count) // 10 votes maximum par concours
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching vote counts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vote counts' },
      { status: 500 }
    );
  }
} 