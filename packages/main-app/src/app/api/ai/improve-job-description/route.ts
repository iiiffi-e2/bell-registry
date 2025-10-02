/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

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

    const { currentDescription, jobTitle, professionalRole } = await req.json();
    
    if (!currentDescription) {
      return new NextResponse(
        JSON.stringify({ error: "Job description is required" }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `Please improve the following job description to make it more engaging, professional, and impactful. 
    Keep the same core information but enhance the language, structure, and presentation.
    DO NOT include the job title, professional role, or "Position Overview" in your response.
    Start directly with the description content:

    Job Title: ${jobTitle}
    Professional Role: ${professionalRole}
    Current Description:
    ${currentDescription}

    Guidelines:
    - Maintain a professional tone
    - Highlight key responsibilities and requirements
    - Make it more engaging and attractive to potential candidates
    - Keep it concise but comprehensive
    - Ensure it flows naturally
    - Preserve all factual information
    - Include clear sections for responsibilities and requirements
    - Emphasize the unique aspects of the role
    - DO NOT include the job title, professional role, or "Position Overview" in your response
    - Start directly with the description content
    `;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a professional job description writer who helps employers create compelling and effective job listings. Do not include job titles, professional roles, or 'Position Overview' in your responses."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const improvedDescription = completion.choices[0]?.message?.content || "";

      return NextResponse.json(
        { improvedDescription },
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
          error: "Failed to generate improved job description",
          details: openaiError.message
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error: any) {
    console.error("Error in improve-job-description route:", error);
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