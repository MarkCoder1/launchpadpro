import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "../../../auth";

// Singleton Prisma Client
const prisma = globalThis.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

// GET /api/cv/retrieve-all - Fetch user CVs
export async function GET() {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user CVs
    const cv = await prisma.CV.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
      select: { fileUrl: true , style: true, createdAt: true, name: true },
    });

    return NextResponse.json({ cv });
  } catch (error) {
    console.error("Error fetching user CVs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}