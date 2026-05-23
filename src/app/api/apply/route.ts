import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { answers, userId } = await req.json();

    if (!userId || !answers) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if user already applied
    const existingApp = await prisma.application.findFirst({
      where: { userId }
    });

    if (existingApp) {
      return NextResponse.json({ error: "لقد قمت بتقديم طلب مسبقاً، لا يمكنك التقديم أكثر من مرة." }, { status: 403 });
    }

    // Create the Application
    const application = await prisma.application.create({
      data: {
        userId,
        status: "PENDING",
      }
    });

    // Create Answers
    const answerPromises = Object.entries(answers).map(([questionId, answer]) => {
      return prisma.applicationAnswer.create({
        data: {
          applicationId: application.id,
          questionId,
          answer: answer as string
        }
      });
    });

    await Promise.all(answerPromises);

    // TODO: Send Discord Webhook here if configured

    return NextResponse.json({ success: true, applicationId: application.id });
  } catch (error) {
    console.error("Apply Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
