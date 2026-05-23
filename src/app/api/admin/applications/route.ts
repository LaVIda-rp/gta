import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "SUPPORT"].includes((session.user as any).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const applications = await prisma.application.findMany({
      include: {
        user: { select: { name: true, image: true, discordId: true } },
        answers: { include: { question: { select: { question: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(applications);
  } catch (e) {
    console.error(e);
    return NextResponse.json([], { status: 500 });
  }
}
