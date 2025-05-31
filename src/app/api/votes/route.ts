import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import Vote from '@/models/Vote';
import Contest from '@/models/Contest';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { contestId, beat1Id, beat2Id, votedBeatId } = await request.json();
    console.log('Vote request data:', { contestId, beat1Id, beat2Id, votedBeatId, userId: session.user.id });

    if (!contestId || !beat1Id || !beat2Id || !votedBeatId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Valider que les IDs sont des ObjectIds MongoDB valides
    if (!mongoose.Types.ObjectId.isValid(contestId) ||
        !mongoose.Types.ObjectId.isValid(beat1Id) ||
        !mongoose.Types.ObjectId.isValid(beat2Id) ||
        !mongoose.Types.ObjectId.isValid(votedBeatId) ||
        !mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
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
    const voteData = {
      contest: contestId,
      beat1: beat1Id,
      beat2: beat2Id,
      votedBeat: votedBeatId,
      voter: session.user.id,
    };
    console.log('Creating vote with data:', voteData);

    const vote = await Vote.create(voteData);
    console.log('Vote created successfully:', vote);

    return NextResponse.json(vote);
  } catch (error) {
    console.error('Error submitting vote:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return NextResponse.json(
      { error: 'Failed to submit vote', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 