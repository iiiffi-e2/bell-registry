import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { currentBio } = await request.json();
    
    if (!currentBio) {
      return new NextResponse("Bio is required", { status: 400 });
    }

    const prompt = `Please improve the following professional bio to make it more engaging, professional, and impactful. 
    Keep the same core information but enhance the language, structure, and presentation:

    ${currentBio}

    Guidelines:
    - Maintain a professional tone
    - Highlight key achievements and skills
    - Make it more engaging and memorable
    - Keep it concise but comprehensive
    - Ensure it flows naturally
    - Preserve all factual information
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a professional bio writer who helps people improve their professional profiles."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const improvedBio = completion.choices[0]?.message?.content || "";

    return NextResponse.json({ improvedBio });
  } catch (error) {
    console.error("Error improving bio:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 