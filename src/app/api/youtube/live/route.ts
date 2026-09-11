import { NextResponse } from 'next/server';
import { getLiveFeed } from '@/lib/youtube/client';

export const revalidate = 600; // 10 minutes

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') ?? undefined;

  try {
    const feed = await getLiveFeed(query);
    return NextResponse.json(feed, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800'
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'YouTube feed failed';
    const status = message.includes('not configured') ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}