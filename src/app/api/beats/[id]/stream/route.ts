import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Submission from '@/models/Submission';
import { Readable } from 'stream';
import { headers } from 'next/headers';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const submission = await Submission.findById(params.id);
    if (!submission) {
      return new NextResponse('Submission not found', { status: 404 });
    }

    // Vérifier si le fichier existe
    if (!submission.trackUrl) {
      return new NextResponse('Track not found', { status: 404 });
    }

    // Construire l'URL complète
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;
    const fullUrl = new URL(submission.trackUrl, baseUrl).toString();

    // Récupérer le fichier depuis le stockage
    const response = await fetch(fullUrl);
    if (!response.ok) {
      return new NextResponse('Failed to fetch track', { status: 500 });
    }

    // Convertir la réponse en stream
    const stream = Readable.fromWeb(response.body as any);

    // Retourner le stream avec les bons headers
    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'inline',
      },
    });
  } catch (error) {
    console.error('Error streaming beat:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 