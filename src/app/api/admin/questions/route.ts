import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    const question = await prisma.formQuestion.create({
      data: {
        question: data.question,
        type: data.type,
        options: data.options ? JSON.stringify(data.options) : null,
        required: data.required,
        order: data.order || 0
      }
    });

    return NextResponse.json({ success: true, question });
  } catch (error) {
    console.error("Create Question Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
