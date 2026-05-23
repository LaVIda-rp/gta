import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "SUPPORT"].includes((session.user as any).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await req.json();
    const app = await prisma.application.update({
      where: { id },
      data: { status },
    });
    return NextResponse.json({ success: true, app });
  } catch (e) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
