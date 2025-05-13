import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { currentBio } = await request.json();

    if (!currentBio) {
      return new NextResponse("Bio is required", { status: 400 });
    }

    const prompt = `Please improve this professional bio to make it more engaging, professional, and impactful while maintaining its authenticity and core message. Keep the same information but enhance the writing:

${currentBio}

The improved bio should:
1. Be more concise and impactful
2. Use active voice
3. Highlight key achievements and skills
4. Maintain a professional tone
5. Be well-structured with clear paragraphs
6. Keep the same length or slightly shorter
7. Preserve all factual information`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a professional bio writer who helps people improve their professional profiles. Your task is to enhance their bio while maintaining authenticity and core message."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const improvedBio = completion.choices[0].message.content;

    return NextResponse.json({ improvedBio });
  } catch (error) {
    console.error("[IMPROVE_BIO]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 