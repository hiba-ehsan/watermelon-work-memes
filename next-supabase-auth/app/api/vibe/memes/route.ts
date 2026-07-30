import { NextResponse } from 'next/server';

export async function GET() {
  const apiUrl = process.env.API_URL || 'http://localhost:4000';

  try {
    const res = await fetch(`${apiUrl}/vibe/memes`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch memes' },
      { status: 502 },
    );
  }
}
