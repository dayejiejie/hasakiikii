import { NextRequest } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: process.env.NEXT_PUBLIC_OPENAI_API_URL || "https://yunwu.ai/v1",
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || "sk-xxxx",
});

export async function POST(req: NextRequest) {
  try {
    const { model, messages, max_tokens } = await req.json();

    const response = await client.chat.completions.create({
      model: model,
      messages: messages,
      max_tokens: max_tokens,
      temperature: 0.7,
      stream: false
    });

    const reply = response.choices[0].message.content;

    return new Response(JSON.stringify({ reply }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : '未知错误' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
} 