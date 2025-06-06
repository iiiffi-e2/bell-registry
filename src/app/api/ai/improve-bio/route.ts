import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OpenAI from "openai";

export const dynamic = 'force-dynamic';

// Add timeout and max retries to the configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000, // 30 seconds timeout
  maxRetries: 3,
});

export async function POST(req: NextRequest) {
  try {
    // Verify API key is present
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key is not configured");
      return new NextResponse(
        JSON.stringify({ error: "OpenAI API is not properly configured" }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { currentBio } = await req.json();
    
    if (!currentBio) {
      return new NextResponse(
        JSON.stringify({ error: "Bio is required" }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `Please improve the following professional bio to make it more engaging, professional, and impactful. 
    Keep the same core information but enhance the language, structure, and presentation:

    ${currentBio}

    Guidelines:
    - Maintain a professional tone
    - Make it sound polished and professional but down to earth and friendly
    - Keep it concise and stay away from fluffy words like "elevated" and "distinguished"
    - Highlight key achievements and skills
    - Make it more engaging and memorable
    - Keep it concise but comprehensive
    - Ensure it flows naturally
    - Preserve all factual information
    `;

    try {
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

      return NextResponse.json(
        { improvedBio },
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (openaiError: any) {
      console.error("OpenAI API Error:", {
        error: openaiError,
        message: openaiError.message,
        type: openaiError.type,
        code: openaiError.code
      });
      
      // Return a more specific error message
      return new NextResponse(
        JSON.stringify({ 
          error: "Failed to generate improved bio",
          details: openaiError.message
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error: any) {
    console.error("Error in improve-bio route:", error);
    return new NextResponse(
      JSON.stringify({ 
        error: "Internal server error",
        details: error.message 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 