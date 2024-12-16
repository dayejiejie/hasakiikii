import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt, size = "1024x1024", quality = "standard" } = await req.json();

    const client = new OpenAI({
      baseURL: process.env.NEXT_PUBLIC_OPENAI_API_URL,
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    });

    const response = await client.images.generate({
      model: "dall-e-3",
      prompt,
      size,
      quality,
      n: 1,
    });

    return NextResponse.json({ success: true, imageUrl: response.data[0].url });
  } catch (error: any) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 