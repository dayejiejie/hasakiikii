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
    const { prompt } = await request.json();

    // 发送请求到 Suno API
    const response = await openai.chat.completions.create({
      model: 'suno-v3',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      stream: false
    });

    const audioUrl = response.choices[0]?.message?.content;
    return NextResponse.json({ audioUrl });
  } catch (error) {
    console.error('Suno API 错误:', error);
    return NextResponse.json(
      { error: '音乐生成失败: ' + (error instanceof Error ? error.message : '未知错误') },
      { status: 500 }
    );
  }
} 