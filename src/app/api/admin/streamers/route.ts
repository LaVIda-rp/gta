import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const streamers = await prisma.streamer.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(streamers);
  } catch (error) {
    return NextResponse.json({ error: "Error fetching streamers" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, platform, avatar, link, isLive, viewers } = body;

    const newStreamer = await prisma.streamer.create({
      data: {
        name,
        platform: platform || "Twitch",
        avatar,
        link,
        isLive: isLive || false,
        viewers: viewers || 0,
      },
    });

    return NextResponse.json({ streamer: newStreamer }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error creating streamer" }, { status: 500 });
  }
}
