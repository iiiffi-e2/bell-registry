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
    const { query, audio } = body;

    if (!query && !audio) {
      return NextResponse.json(
        { error: 'Either text query or audio is required' },
        { status: 400 }
      );
    }

    let searchText = query;

    // Handle audio transcription if provided
    if (audio && !query) {
      try {
        // Convert base64 audio to File object
        const audioBlob = new Blob([Buffer.from(audio, 'base64')], { type: 'audio/webm' });
        const audioFile = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });
        
        searchText = await aiSearchService.transcribeAudio(audioFile);
      } catch (error) {
        console.error('Audio transcription failed:', error);
        return NextResponse.json(
          { error: 'Failed to transcribe audio. Please try typing your search.' },
          { status: 400 }
        );
      }
    }

    // Parse the search query
    console.log('🔍 AI Search API - Original query:', searchText);
    const { parsedSearch, summary } = await aiSearchService.parseJobSearchQuery(searchText);
    console.log('🧠 AI Search API - Parsed search:', JSON.stringify(parsedSearch, null, 2));

    // Find matching jobs
    const matches = await aiSearchService.findMatchingJobs(parsedSearch);
    console.log('✅ AI Search API - Found matches:', matches.length);

    return NextResponse.json({
      originalQuery: searchText,
      parsedSearch,
      summary,
      matches,
      totalMatches: matches.length
    });

  } catch (error: any) {
    console.error('Error in AI search:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process search request',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve saved search results
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, return empty - in future versions we could store search history
    return NextResponse.json({
      searches: [],
      message: 'Search history feature coming soon'
    });

  } catch (error: any) {
    console.error('Error retrieving search history:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve search history' },
      { status: 500 }
    );
  }
} 