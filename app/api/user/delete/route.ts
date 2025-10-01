import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { auth } from "../../../auth"

const prisma = new PrismaClient()

// DELETE - Delete user account
export async function DELETE() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete the user account
    await prisma.user.delete({
      where: { id: session.user.id }
    })

    return NextResponse.json({ 
      message: "Account deleted successfully" 
    })
  } catch (error) {
    console.error("Error deleting user account:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}