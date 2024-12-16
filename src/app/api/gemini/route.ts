import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// 初始化 OpenAI 客户端
const openai = new OpenAI({
  baseURL: process.env.NEXT_PUBLIC_OPENAI_API_URL || 'https://yunwu.ai/v1',
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || 'sk-w5Wl3fIhAwHWQeGExkEQUzUXyvzWw4b47XoTpfMDIp8I2heC',
  timeout: 120000, // 120 秒超时
  dangerouslyAllowBrowser: true
});

export async function POST(request: Request) {
  try {
    const { messages, bilingual } = await request.json();

    // 如果启用双语模式，修改提示词
    let prompt = bilingual 
      ? '请用中文和英文回答以下问题，用"---"分隔中英文回答。'
      : '请用中文回答以下问题。';

    // 发送请求到 OpenAI 兼容的 API
    const response = await openai.chat.completions.create({
      model: 'gemini-2.0-flash-exp',
      messages: [
        { role: 'system', content: prompt },
        ...messages
      ],
      max_tokens: 2048,
      temperature: 0.7,
      stream: false
    });

    const reply = response.choices[0]?.message?.content;
    if (!reply) {
      throw new Error('API 返回的响应中没有内容');
    }

    // 如果是双语模式，分割回复
    if (bilingual) {
      const [chinese, english] = reply.split('---').map(text => text.trim());
      return NextResponse.json({ 
        reply: chinese,
        translation: english
      });
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('API 错误:', error);
    if (error instanceof OpenAI.APIError) {
      console.error('OpenAI API 错误详情:', {
        status: error.status,
        message: error.message,
        code: error.code,
        type: error.type
      });
    }
    return NextResponse.json(
      { error: '生成回复失败: ' + (error instanceof Error ? error.message : '未知错误') },
      { status: 500 }
    );
  }
} 