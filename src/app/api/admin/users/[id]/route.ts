import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userToDemote = await prisma.user.findUnique({ where: { id } });
    
    if (!userToDemote) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Demote to USER instead of deleting the whole account
    await prisma.user.update({
      where: { id },
      data: { role: "USER" }
    });

    return NextResponse.json({ message: "User demoted to regular user" });
  } catch (error) {
    return NextResponse.json({ error: "Error demoting user" }, { status: 500 });
  }
}
