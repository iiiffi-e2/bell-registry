import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { readFile } from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { filename } = params;
    
    // Extract the user ID from the filename to verify ownership
    const parts = filename.split('_');
    const isResume = filename.startsWith('resume_');
    const isCoverLetter = filename.startsWith('cover_');
    
    if (!isResume && !isCoverLetter) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // For employers, check if they own the job the application is for
    if (session.user.role === 'EMPLOYER') {
      // Find the application that has this file
      const application = await prisma.jobApplication.findFirst({
        where: {
          OR: [
            { resumeUrl: `/uploads/applications/${filename}` },
            { coverLetterUrl: `/uploads/applications/${filename}` }
          ],
          job: {
            employerId: session.user.id
          }
        }
      });

      if (!application) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    } 
    // For professionals, they can only access their own files
    else if (session.user.role === 'PROFESSIONAL') {
      if (parts[1] !== session.user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Read and serve the file
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'applications', filename);
    
    try {
      const fileBuffer = await readFile(filePath);
      
      // Determine content type based on file extension
      const ext = path.extname(filename).toLowerCase();
      let contentType = 'application/octet-stream';
      
      if (ext === '.pdf') {
        contentType = 'application/pdf';
      } else if (ext === '.doc') {
        contentType = 'application/msword';
      } else if (ext === '.docx') {
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      }

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${isResume ? 'resume' : 'cover_letter'}${ext}"`,
        },
      });
    } catch (error) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    );
  }
} 