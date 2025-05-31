import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Vote from '@/models/Vote';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const contestId = searchParams.get('contestId');

    if (!contestId) {
      return NextResponse.json(
        { error: 'Contest ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Récupérer tous les votes pour le concours
    const votes = await Vote.find({ contest: contestId });

    // Compter les votes pour chaque soumission
    const stats = votes.reduce((acc: { [key: string]: number }, vote) => {
      const votedBeatId = vote.votedBeat.toString();
      acc[votedBeatId] = (acc[votedBeatId] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching vote stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vote stats' },
      { status: 500 }
    );
  }
} 