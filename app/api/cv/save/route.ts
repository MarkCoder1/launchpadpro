import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../auth";
import { PrismaClient } from "@prisma/client";


// Singleton Prisma Client
const prisma = globalThis.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

// POST /api/cv/save - Save a generated CV record
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

  const { fileUrl, style, name } = await req.json();

    // Validate input
    if (!fileUrl) {
      return NextResponse.json(
        { error: "File URL is required" },
        { status: 400 }
      );
    }

    // Create CV record
    const cv = await prisma.CV.create({
      data: {
        userId: session.user.id,
        fileUrl: fileUrl,
        style: typeof style === 'string' ? style : null,
        // name can be user-entered; store raw string if provided
        ...(typeof name === 'string' && name.trim() ? { name: name.trim() } : {}),
      },
    });

    return NextResponse.json({ cv });
  } catch (error) {
  console.error("[api/cv/save] Error creating CV:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "CV already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
