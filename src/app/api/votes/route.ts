import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Vote from '@/models/Vote';
import Contest from '@/models/Contest';

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { beat1Id, beat2Id, votedBeatId, contestId } = await request.json();

    if (!beat1Id || !beat2Id || !votedBeatId || !contestId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if contest is in voting phase
    const contest = await Contest.findById(contestId);
    if (!contest) {
      return NextResponse.json(
        { error: 'Contest not found' },
        { status: 404 }
      );
    }

    if (contest.status !== 'voting') {
      return NextResponse.json(
        { error: 'Contest is not in voting phase' },
        { status: 400 }
      );
    }

    // Check if user has already voted for this pair
    const existingVote = await Vote.findOne({
      contest: contestId,
      voter: session.user.id,
      $or: [
        { beat1: beat1Id, beat2: beat2Id },
        { beat1: beat2Id, beat2: beat1Id },
      ],
    });

    if (existingVote) {
      return NextResponse.json(
        { error: 'You have already voted for this pair' },
        { status: 400 }
      );
    }

    // Create new vote
    const vote = await Vote.create({
      contest: contestId,
      beat1: beat1Id,
      beat2: beat2Id,
      votedBeat: votedBeatId,
      voter: session.user.id,
    });

    return NextResponse.json(vote);
  } catch (error) {
    console.error('Error submitting vote:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 