import { NextRequest } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: process.env.NEXT_PUBLIC_OPENAI_API_URL || "https://yunwu.ai/v1",
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || "sk-xxxx",
});

export async function POST(req: NextRequest) {
  try {
    const { model, messages, max_tokens } = await req.json();

    // 检查是否需要双语回复
    const isBilingual = messages[0]?.content?.includes('请同时用中文和英文回答');

    const response = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: isBilingual 
            ? '你是一个专业的双语助手。请同时用中文和英文回答问题。先用中文回答，然后用"===="分隔符，再用英文回答。请确保两种语言的回答内容完全一致，包括格式、代码块和数学公式。'
            : messages[0].content
        },
        ...messages.slice(1)
      ],
      max_tokens: max_tokens,
      temperature: 0.7,
      stream: false
    });

    const reply = response.choices[0].message.content;

    // 如果是双语模式但回复中没有分隔符，尝试再次请求英文翻译
    if (isBilingual && !reply?.includes('====')) {
      const translationResponse = await client.chat.completions.create({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional translator. Please translate the following Chinese text to English, maintaining the same format, structure, and any special elements like code blocks or mathematical formulas.'
          },
          {
            role: 'user',
            content: reply || ''
          }
        ],
        max_tokens: max_tokens,
        temperature: 0.3,
        stream: false
      });

      const translation = translationResponse.choices[0].message.content;
      const bilingualReply = `${reply}\n====\n${translation}`;
      
      return new Response(JSON.stringify({ reply: bilingualReply }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

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