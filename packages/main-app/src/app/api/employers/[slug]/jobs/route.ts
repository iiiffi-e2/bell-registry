import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // Find the employer profile by public slug
    const employerProfile = await prisma.employerProfile.findUnique({
      where: { publicSlug: slug },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!employerProfile) {
      return NextResponse.json(
        { error: "Employer not found" },
        { status: 404 }
      );
    }

    // Fetch jobs for this employer
    const jobs = await prisma.job.findMany({
      where: {
        employerId: employerProfile.user.id,
        status: "ACTIVE",
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        employer: {
          select: {
            firstName: true,
            lastName: true,
            employerProfile: {
              select: {
                companyName: true,
                logoUrl: true,
                location: true,
              },
            },
          },
        },
      },
      orderBy: [
        { featured: "desc" },
        { createdAt: "desc" },
      ],
      skip: offset,
      take: limit,
    });

    // Get total count for pagination
    const total = await prisma.job.count({
      where: {
        employerId: employerProfile.user.id,
        status: "ACTIVE",
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    return NextResponse.json({
      jobs,
      employer: {
        companyName: employerProfile.companyName,
        description: employerProfile.description,
        website: employerProfile.website,
        logoUrl: employerProfile.logoUrl,
        location: employerProfile.location,
        publicSlug: employerProfile.publicSlug,
      },
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching employer jobs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 