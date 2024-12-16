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
    const { messages, mode } = await request.json();

    // 发送请求到 OpenAI 兼容的 API
    const response = await openai.chat.completions.create({
      model: 'gemini-2.0-flash-exp',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的视频分析助手，请分析用户提供的视频内容并给出详细的描述。'
        },
        ...messages
      ],
      max_tokens: 2048,
      temperature: 0.7,
      stream: false
    });

    const reply = response.choices[0]?.message?.content || '无法分析视频内容';
    return NextResponse.json({ reply });
  } catch (error) {
    console.error('API 错误:', error);
    return NextResponse.json(
      { error: '视频分析失败: ' + (error instanceof Error ? error.message : '未知错误') },
      { status: 500 }
    );
  }
} 