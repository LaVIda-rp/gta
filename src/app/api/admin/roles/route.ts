import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { email } = await req.json();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "هذا الإيميل لم يقم بتسجيل الدخول للموقع من قبل." }, { status: 404 });
    }

    await prisma.user.update({
      where: { email },
      data: { role: "ADMIN" }
    });

    return NextResponse.json({ success: true, message: "تمت ترقية العضو بنجاح!" });
  } catch (e) {
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { name: true, email: true, image: true, id: true }
    });

    return NextResponse.json(admins);
  } catch (e) {
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
