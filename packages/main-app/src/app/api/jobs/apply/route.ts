import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { storageProvider } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';
import { sendJobApplicationNotificationEmail } from '@/lib/job-application-email-service';

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

    // Validate file types and sizes
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(resumeFile.type)) {
      return NextResponse.json({ error: 'Resume must be a PDF or Word document' }, { status: 400 });
    }

    if (resumeFile.size > maxSize) {
      return NextResponse.json({ error: 'Resume file size must be less than 5MB' }, { status: 400 });
    }

    if (coverLetterFile) {
      if (!allowedTypes.includes(coverLetterFile.type)) {
        return NextResponse.json({ error: 'Cover letter must be a PDF or Word document' }, { status: 400 });
      }

      if (coverLetterFile.size > maxSize) {
        return NextResponse.json({ error: 'Cover letter file size must be less than 5MB' }, { status: 400 });
      }
    }

    // Check if job exists and get employer info
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { 
        id: true, 
        status: true,
        title: true,
        location: true,
        employer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            employerProfile: {
              select: {
                companyName: true
              }
            }
          }
        }
      }
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

    // Upload resume file
    const resumeExt = resumeFile.name.split('.').pop()?.toLowerCase();
    const resumeFileName = `applications/resume_${session.user.id}_${Date.now()}_${uuidv4()}.${resumeExt}`;
    const resumeBuffer = Buffer.from(await resumeFile.arrayBuffer());
    const resumeUrl = await storageProvider.uploadFile(resumeBuffer, resumeFileName, resumeFile.type);

    // Upload cover letter file if provided
    let coverLetterUrl: string | null = null;
    if (coverLetterFile) {
      const coverLetterExt = coverLetterFile.name.split('.').pop()?.toLowerCase();
      const coverLetterFileName = `applications/cover_${session.user.id}_${Date.now()}_${uuidv4()}.${coverLetterExt}`;
      const coverLetterBuffer = Buffer.from(await coverLetterFile.arrayBuffer());
      coverLetterUrl = await storageProvider.uploadFile(coverLetterBuffer, coverLetterFileName, coverLetterFile.type);
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

    // Send email notification to employer
    try {
      // Fetch candidate profile to get name information
      const candidateProfile = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { firstName: true, lastName: true, email: true }
      });

      const candidateName = candidateProfile ? 
        `${candidateProfile.firstName || ''} ${candidateProfile.lastName || ''}`.trim() || 'Professional' : 
        'Professional';
      
      const employerName = `${job.employer.firstName || ''} ${job.employer.lastName || ''}`.trim() || 'Employer';
      const companyName = job.employer.employerProfile?.companyName || 'Company';

      await sendJobApplicationNotificationEmail({
        employerEmail: job.employer.email,
        employerName,
        companyName,
        jobTitle: job.title,
        jobLocation: job.location,
        candidateName,
        candidateEmail: candidateProfile?.email || session.user.email!,
        applicationId: application.id,
        resumeUrl,
        coverLetterUrl: coverLetterUrl || undefined,
        message: message || undefined,
        applicationDate: new Date()
      });

      console.log('[JOB_APPLICATION] Email notification sent successfully to employer:', job.employer.email);
    } catch (emailError) {
      // Log email error but don't fail the application submission
      console.error('[JOB_APPLICATION] Failed to send email notification:', emailError);
    }

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