import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as z from "zod";

const createJobAlertSchema = z.object({
  name: z.string().min(1, "Alert name is required"),
  roles: z.array(z.string()).min(1, "At least one role is required"),
  locations: z.array(z.string()).min(1, "At least one location is required"),
  frequency: z.enum(["DAILY", "WEEKLY"]),
});

// GET - Fetch user's job alerts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const jobAlerts = await prisma.jobAlert.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(jobAlerts);
  } catch (error) {
    console.error("[JOB_ALERTS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// POST - Create new job alert
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { name, roles, locations, frequency } = createJobAlertSchema.parse(body);

    const jobAlert = await prisma.jobAlert.create({
      data: {
        userId: session.user.id,
        name,
        roles,
        locations,
        frequency,
      },
    });

    return NextResponse.json(jobAlert);
  } catch (error) {
    console.error("[JOB_ALERTS_POST]", error);
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 400 });
    }
    return new NextResponse("Internal error", { status: 500 });
  }
} 