import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "../../../auth";

// Singleton Prisma Client
const prisma = globalThis.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

// GET /api/user/experience - Fetch user experience
export async function GET() {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user experience entries
    const experience = await prisma.experience.findMany({
      where: { userId: session.user.id },
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json({ experience });
  } catch (error) {
    console.error("Error fetching user experience:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/user/experience - Add new experience entry
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { company, position, location, startDate, endDate, description, isCurrently } = await req.json();

    // Validate required fields
    if (!company || !position || !startDate) {
      return NextResponse.json(
        { error: "Company, position, and start date are required" },
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

    // Create experience entry
    const experienceEntry = await prisma.experience.create({
      data: {
        company,
        position,
        location: location || null,
        startDate: start,
        endDate: end,
        description: description || null,
        isCurrently: isCurrently || false,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ experience: experienceEntry });
  } catch (error) {
    console.error("Error creating experience entry:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/user/experience - Update experience entry
export async function PUT(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, company, position, location, startDate, endDate, description, isCurrently } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Experience ID is required" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!company || !position || !startDate) {
      return NextResponse.json(
        { error: "Company, position, and start date are required" },
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

    // Verify experience belongs to user and update
    const existingExperience = await prisma.experience.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingExperience) {
      return NextResponse.json(
        { error: "Experience entry not found" },
        { status: 404 }
      );
    }

    const updatedExperience = await prisma.experience.update({
      where: { id },
      data: {
        company,
        position,
        location: location || null,
        startDate: start,
        endDate: end,
        description: description || null,
        isCurrently: isCurrently || false,
      },
    });

    return NextResponse.json({ experience: updatedExperience });
  } catch (error) {
    console.error("Error updating experience entry:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/user/experience - Delete experience entry
export async function DELETE(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { experienceId } = await req.json();

    if (!experienceId) {
      return NextResponse.json(
        { error: "Experience ID is required" },
        { status: 400 }
      );
    }

    // Verify experience belongs to user and delete
    const experience = await prisma.experience.findFirst({
      where: {
        id: experienceId,
        userId: session.user.id,
      },
    });

    if (!experience) {
      return NextResponse.json(
        { error: "Experience entry not found" },
        { status: 404 }
      );
    }

    await prisma.experience.delete({
      where: { id: experienceId },
    });

    return NextResponse.json({ message: "Experience entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting experience entry:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}