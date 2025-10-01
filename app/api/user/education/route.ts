import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "../../../auth";

// Singleton Prisma Client
const prisma = globalThis.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

// GET /api/user/education - Fetch user education
export async function GET() {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user education entries
    const education = await prisma.education.findMany({
      where: { userId: session.user.id },
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json({ education });
  } catch (error) {
    console.error("Error fetching user education:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/user/education - Add new education entry
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { institution, degree, fieldOfStudy, startDate, endDate, description, isCurrently } = await req.json();

    // Validate required fields
    if (!institution || !degree || !startDate) {
      return NextResponse.json(
        { error: "Institution, degree, and start date are required" },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      return NextResponse.json(
        { error: "Invalid start date" },
        { status: 400 }
      );
    }

    let end = null;
    if (endDate && !isCurrently) {
      end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return NextResponse.json(
          { error: "Invalid end date" },
          { status: 400 }
        );
      }
      if (end <= start) {
        return NextResponse.json(
          { error: "End date must be after start date" },
          { status: 400 }
        );
      }
    }

    // Create education entry
    const educationEntry = await prisma.education.create({
      data: {
        institution,
        degree,
        fieldOfStudy: fieldOfStudy || null,
        startDate: start,
        endDate: end,
        description: description || null,
        isCurrently: isCurrently || false,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ education: educationEntry });
  } catch (error) {
    console.error("Error creating education entry:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/user/education - Update education entry
export async function PUT(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, institution, degree, fieldOfStudy, startDate, endDate, description, isCurrently } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Education ID is required" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!institution || !degree || !startDate) {
      return NextResponse.json(
        { error: "Institution, degree, and start date are required" },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      return NextResponse.json(
        { error: "Invalid start date" },
        { status: 400 }
      );
    }

    let end = null;
    if (endDate && !isCurrently) {
      end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return NextResponse.json(
          { error: "Invalid end date" },
          { status: 400 }
        );
      }
      if (end <= start) {
        return NextResponse.json(
          { error: "End date must be after start date" },
          { status: 400 }
        );
      }
    }

    // Verify education belongs to user and update
    const existingEducation = await prisma.education.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingEducation) {
      return NextResponse.json(
        { error: "Education entry not found" },
        { status: 404 }
      );
    }

    const updatedEducation = await prisma.education.update({
      where: { id },
      data: {
        institution,
        degree,
        fieldOfStudy: fieldOfStudy || null,
        startDate: start,
        endDate: end,
        description: description || null,
        isCurrently: isCurrently || false,
      },
    });

    return NextResponse.json({ education: updatedEducation });
  } catch (error) {
    console.error("Error updating education entry:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/user/education - Delete education entry
export async function DELETE(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { educationId } = await req.json();

    if (!educationId) {
      return NextResponse.json(
        { error: "Education ID is required" },
        { status: 400 }
      );
    }

    // Verify education belongs to user and delete
    const education = await prisma.education.findFirst({
      where: {
        id: educationId,
        userId: session.user.id,
      },
    });

    if (!education) {
      return NextResponse.json(
        { error: "Education entry not found" },
        { status: 404 }
      );
    }

    await prisma.education.delete({
      where: { id: educationId },
    });

    return NextResponse.json({ message: "Education entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting education entry:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}