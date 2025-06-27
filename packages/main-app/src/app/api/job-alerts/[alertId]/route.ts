import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as z from "zod";

const updateJobAlertSchema = z.object({
  name: z.string().min(1).optional(),
  roles: z.array(z.string()).min(1).optional(),
  locations: z.array(z.string()).min(1).optional(),
  frequency: z.enum(["DAILY", "WEEKLY"]).optional(),
  isActive: z.boolean().optional(),
});

// PUT - Update job alert
export async function PUT(
  request: NextRequest,
  { params }: { params: { alertId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const updateData = updateJobAlertSchema.parse(body);

    const jobAlert = await prisma.jobAlert.updateMany({
      where: {
        id: params.alertId,
        userId: session.user.id,
      },
      data: updateData,
    });

    if (jobAlert.count === 0) {
      return new NextResponse("Job alert not found", { status: 404 });
    }

    const updatedAlert = await prisma.jobAlert.findUnique({
      where: { id: params.alertId },
    });

    return NextResponse.json(updatedAlert);
  } catch (error) {
    console.error("[JOB_ALERT_PUT]", error);
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 400 });
    }
    return new NextResponse("Internal error", { status: 500 });
  }
}

// DELETE - Delete job alert
export async function DELETE(
  request: NextRequest,
  { params }: { params: { alertId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const deletedAlert = await prisma.jobAlert.deleteMany({
      where: {
        id: params.alertId,
        userId: session.user.id,
      },
    });

    if (deletedAlert.count === 0) {
      return new NextResponse("Job alert not found", { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[JOB_ALERT_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 