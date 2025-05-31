import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import Vote from '@/models/Vote';
import Contest from '@/models/Contest';

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { contestId, beat1Id, beat2Id, votedBeatId } = await request.json();

    if (!contestId || !beat1Id || !beat2Id || !votedBeatId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDB();

    // Vérifier si le concours existe et est actif
    const contest = await Contest.findById(contestId);
    if (!contest || contest.status !== 'active') {
      return NextResponse.json(
        { error: 'Contest not found or not active' },
        { status: 404 }
      );
    }

    // Vérifier si l'utilisateur a déjà voté pour cette paire
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

    // Vérifier le nombre de votes restants
    const voteCount = await Vote.countDocuments({
      contest: contestId,
      voter: session.user.id,
    });

    if (voteCount >= 10) {
      return NextResponse.json(
        { error: 'You have reached the maximum number of votes for this contest' },
        { status: 400 }
      );
    }

    // Créer le vote
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
      { error: 'Failed to submit vote' },
      { status: 500 }
    );
  }
} 