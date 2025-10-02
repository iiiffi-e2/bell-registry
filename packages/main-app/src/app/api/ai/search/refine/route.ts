/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { aiSearchService } from "@/lib/ai-search-service";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { originalSearch, userFeedback, previousResults } = body;

    if (!originalSearch || !userFeedback) {
      return NextResponse.json(
        { error: 'Original search and user feedback are required' },
        { status: 400 }
      );
    }

    // Use simple approach for now - just parse the feedback as a new search
    const { parsedSearch, summary } = await aiSearchService.parseJobSearchQuery(userFeedback);
    const newMatches = await aiSearchService.findMatchingJobs(parsedSearch);

    // Generate AI response about the refinement
    let aiResponse = `I understand you'd like to refine your search. `;
    
    if (userFeedback.toLowerCase().includes('no travel')) {
      aiResponse += `I've updated your search to exclude travel requirements. `;
    }
    if (userFeedback.toLowerCase().includes('salary') || userFeedback.toLowerCase().includes('pay')) {
      aiResponse += `I've adjusted the salary criteria based on your preferences. `;
    }
    if (userFeedback.toLowerCase().includes('location')) {
      aiResponse += `I've updated the location preferences. `;
    }

    aiResponse += `Here are ${newMatches.length} new matches that better fit your requirements:`;

    return NextResponse.json({
      userFeedback,
      aiResponse,
      updatedSearch: parsedSearch,
      newResults: newMatches,
      summary
    });

  } catch (error: any) {
    console.error('Error refining search:', error);
    return NextResponse.json(
      { 
        error: 'Failed to refine search',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 