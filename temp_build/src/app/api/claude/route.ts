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
      prompt = `${message}\n\n请同时用中文和英文回答问题。先用中文回答，然后用"===="分隔符，再用英文回答。请确保两种语言的回答内容完全一致，包括格式、代码块和数学公式。`;
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

    if (bilingual && !reply.includes('====')) {
      const translationResponse = await client.chat.completions.create({
        model: 'claude-3-5-sonnet-latest',
        messages: [
          {
            role: 'system',
            content: 'You are a professional translator. Please translate the following Chinese text to English, maintaining the same format, structure, and any special elements like code blocks or mathematical formulas.'
          },
          {
            role: 'user',
            content: reply
          }
        ],
        max_tokens: 4000,
        temperature: 0.3
      });

      const translation = translationResponse.choices[0].message.content;
      const bilingualReply = `${reply}\n====\n${translation}`;
      
      return NextResponse.json({ reply: bilingualReply });
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '发生未知错误' },
      { status: 500 }
    );
  }
} 