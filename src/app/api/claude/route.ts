import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { ChatCompletionContentPart } from 'openai/resources/chat/completions';

const client = new OpenAI({
  baseURL: 'https://yunwu.ai/v1',
  apiKey: 'sk-Zo48ALYmgM1SSpn8rhuLoJhsKajuZoQ6GUQAS9Ky1b8RuqnH',
  dangerouslyAllowBrowser: true
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const message = formData.get('message') as string;
    const bilingual = formData.get('bilingual') === 'true';
    const image = formData.get('image') as File | null;

    if (!message && !image) {
      return NextResponse.json({ error: '消息不能为空' }, { status: 400 });
    }

    let prompt = message;
    if (bilingual) {
      prompt += '\n请保持原始格式回复，如果有代码块，保持代码的格式，如果有数学公式，保持数学公式的格式。然后在回答后加上"---"，再给出英文翻译。';
    }

    let content: ChatCompletionContentPart[] = [
      { type: "text", text: prompt }
    ];
    
    if (image) {
      const imageBuffer = await image.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      content.unshift({
        type: "image_url",
        image_url: {
          url: `data:${image.type};base64,${base64Image}`
        }
      } as ChatCompletionContentPart);
    }

    const response = await client.chat.completions.create({
      model: 'claude-3-5-sonnet-latest',
      messages: [
        {
          role: 'user',
          content: content
        }
      ],
      max_tokens: 4000,
      temperature: 0.7
    });

    const reply = response.choices[0].message.content || '抱歉，我现在无法回答这个问题。';

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '发生未知错误' },
      { status: 500 }
    );
  }
} 