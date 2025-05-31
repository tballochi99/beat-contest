import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import { Submission, Contest } from '@/models';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const contestId = formData.get('contestId') as string;
    const extractStart = formData.get('extractStart') as string;
    const extractEnd = formData.get('extractEnd') as string;

    if (!file || !contestId || !extractStart || !extractEnd) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDB();

    // Vérifier si le concours existe
    const contest = await Contest.findById(contestId);
    if (!contest) {
      return NextResponse.json({ error: 'Contest not found' }, { status: 404 });
    }

    // Vérifier si l'utilisateur a déjà soumis une track pour ce concours
    const existingSubmission = await Submission.findOne({
      contest: contestId,
      user: session.user.id
    });

    if (existingSubmission) {
      return NextResponse.json(
        { error: 'You have already submitted a track for this contest' },
        { status: 400 }
      );
    }

    // Créer le dossier uploads s'il n'existe pas
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const filepath = path.join(uploadDir, filename);

    // Sauvegarder le fichier
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(filepath, buffer);

    // Créer la soumission dans la base de données
    const submission = await Submission.create({
      contest: contestId,
      user: session.user.id,
      trackUrl: `/uploads/${filename}`,
      extractStart: parseFloat(extractStart),
      extractEnd: parseFloat(extractEnd),
      status: 'pending'
    });

    // Mettre à jour le concours avec la nouvelle soumission
    await Contest.findByIdAndUpdate(contestId, {
      $push: { submissions: submission._id }
    });

    // Récupérer la soumission avec les informations de l'utilisateur
    const populatedSubmission = await Submission.findById(submission._id)
      .populate('user', 'name avatar')
      .lean();

    return NextResponse.json(populatedSubmission);
  } catch (error) {
    console.error('Error uploading submission:', error);
    return NextResponse.json(
      { error: 'Failed to upload submission' },
      { status: 500 }
    );
  }
} 