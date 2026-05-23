import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ["ADMIN", "SUPPORT"]
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true
      }
    });

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: "Error fetching users" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const adminRole = (session?.user as any)?.role;
    if (!session || adminRole !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, role: assignedRole } = await req.json();

    if (!email || !["ADMIN", "SUPPORT"].includes(assignedRole)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Upsert user by email (if they haven't logged in yet, we create a placeholder)
    const user = await prisma.user.upsert({
      where: { email },
      update: { role: assignedRole },
      create: { email, role: assignedRole, name: email.split("@")[0] }
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Error creating or updating user" }, { status: 500 });
  }
}
