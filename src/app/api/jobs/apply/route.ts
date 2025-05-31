import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Ensure upload directory exists
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'applications');

async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating upload directory:', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'PROFESSIONAL') {
      return NextResponse.json({ error: 'Only professionals can apply to jobs' }, { status: 403 });
    }

    const formData = await req.formData();
    const jobId = formData.get('jobId') as string;
    const resumeFile = formData.get('resume') as File;
    const coverLetterFile = formData.get('coverLetter') as File | null;
    const message = formData.get('message') as string | null;

    if (!jobId || !resumeFile) {
      return NextResponse.json({ error: 'Job ID and resume are required' }, { status: 400 });
    }

    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, status: true }
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'This job is no longer accepting applications' }, { status: 400 });
    }

    // Check if user has already applied
    const existingApplication = await prisma.jobApplication.findFirst({
      where: {
        jobId,
        candidateId: session.user.id
      }
    });

    if (existingApplication) {
      return NextResponse.json({ error: 'You have already applied to this job' }, { status: 400 });
    }

    await ensureUploadDir();

    // Generate unique filenames
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    
    // Save resume file
    const resumeExt = path.extname(resumeFile.name);
    const resumeFilename = `resume_${session.user.id}_${timestamp}_${randomString}${resumeExt}`;
    const resumePath = path.join(UPLOAD_DIR, resumeFilename);
    const resumeBuffer = await resumeFile.arrayBuffer();
    await writeFile(resumePath, new Uint8Array(resumeBuffer));
    const resumeUrl = `/uploads/applications/${resumeFilename}`;

    // Save cover letter file if provided
    let coverLetterUrl: string | null = null;
    if (coverLetterFile) {
      const coverLetterExt = path.extname(coverLetterFile.name);
      const coverLetterFilename = `cover_${session.user.id}_${timestamp}_${randomString}${coverLetterExt}`;
      const coverLetterPath = path.join(UPLOAD_DIR, coverLetterFilename);
      const coverLetterBuffer = await coverLetterFile.arrayBuffer();
      await writeFile(coverLetterPath, new Uint8Array(coverLetterBuffer));
      coverLetterUrl = `/uploads/applications/${coverLetterFilename}`;
    }

    // Create the application
    const application = await prisma.jobApplication.create({
      data: {
        job: {
          connect: { id: jobId }
        },
        candidate: {
          connect: { id: session.user.id }
        },
        resumeUrl,
        coverLetterUrl,
        message: message || null,
        status: 'PENDING'
      }
    });

    return NextResponse.json({ 
      success: true, 
      applicationId: application.id 
    });

  } catch (error) {
    console.error('Error submitting application:', error);
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all applications for the current user
    const applications = await prisma.jobApplication.findMany({
      where: {
        candidateId: session.user.id
      },
      include: {
        job: {
          include: {
            employer: {
              include: {
                employerProfile: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ applications });

  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
} 