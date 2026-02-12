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
      instructions: `당신은 대화 세션 제목을 생성하는 시스템입니다.
                      사용자의 질문을 핵심 의도 중심으로 한 줄로 요약하세요.
                      규칙:
                      - 10~20자 이내
                      - 설명하지 말 것
                      - 따옴표 사용 금지
                      - 이모지 사용 금지
                      - 마침표 사용 금지
                      - 반드시 한 줄로만 출력
                      - 띄어쓰기 철저
                      - 질문이 한국어면 한국어로 출력`,
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
