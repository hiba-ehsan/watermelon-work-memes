import { NextResponse } from 'next/server';

const memes = [
  { id: 1, src: 'meme1.jpg', alt: 'Vibe 1' },
  { id: 2, src: 'meme2.jpg', alt: 'Vibe 2' },
  { id: 3, src: 'meme3.jpg', alt: 'Vibe 3' },
];

export async function GET() {
  return NextResponse.json(memes);
}
