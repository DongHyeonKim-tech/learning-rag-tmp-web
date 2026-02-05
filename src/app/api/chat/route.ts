import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input } = body;

    if (!input || typeof input !== "string") {
      return NextResponse.json(
        { error: "input parameter is required" },
        { status: 400 }
      );
    }

    const response = await client.responses.create({
      model: "gpt-5-nano",
      input: input,
      instructions: "이 질문을 제목으로 요약해줘",
    });

    return NextResponse.json({ title: response.output_text });
  } catch (error) {
    console.error("Error creating chat title:", error);
    return NextResponse.json(
      { error: "Failed to create chat title" },
      { status: 500 }
    );
  }
}
