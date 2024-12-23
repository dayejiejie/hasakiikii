import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 初始化 Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: '未找到提示词' }, { status: 400 });
    }

    // 创建模型
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    console.log('准备调用 Gemini API');
    // 发送请求到 Gemini
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    });

    const response = await result.response;
    const reply = response.text();
    console.log('API调用成功，回复长度:', reply.length);

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('API调用错误:', error);
    
    // 处理特定的错误类型
    if (error instanceof Error) {
      const errorMessage = error.message;
      
      if (errorMessage.includes('fetch failed')) {
        return NextResponse.json({ 
          error: '网络连接错误，请检查网络连接。\n错误信息: ' + errorMessage
        }, { status: 500 });
      }
      
      if (errorMessage.includes('API key')) {
        return NextResponse.json({ 
          error: 'API Key 无效或未正确配置' 
        }, { status: 500 });
      }
    }
    
    return NextResponse.json(
      { 
        error: '调用失败: ' + (error instanceof Error ? error.message : '未知错误')
      },
      { status: 500 }
    );
  }
} 