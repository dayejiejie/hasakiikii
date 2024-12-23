import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { HttpsProxyAgent } from 'https-proxy-agent';
import fetch from 'node-fetch';

// 初始化 Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// 配置代理
const CAMERA_PROXY = process.env.CAMERA_PROXY || 'http://127.0.0.1:7890';
const SCREEN_PROXY = process.env.SCREEN_PROXY || 'http://127.0.0.1:7897';

// 创建自定义 fetch 函数
const customFetch = async (url: string, options: any, proxyUrl: string) => {
  const proxyAgent = new HttpsProxyAgent(proxyUrl);
  return fetch(url, {
    ...options,
    agent: proxyAgent,
    timeout: 30000
  });
};

export async function POST(request: NextRequest) {
  try {
    console.log('开始处理视频分析请求');
    
    const formData = await request.formData();
    const videoFile = formData.get('video') as File;
    const mode = formData.get('mode') as string;

    // 根据模式选择代理
    const proxyUrl = mode === 'camera' ? CAMERA_PROXY : SCREEN_PROXY;
    console.log('使用代理:', proxyUrl);

    if (!videoFile) {
      return NextResponse.json({ error: '未找到视频文件' }, { status: 400 });
    }

    console.log('视频文件信息:', {
      name: videoFile.name,
      type: videoFile.type,
      size: videoFile.size
    });

    // 检查文件类型
    if (!videoFile.type.startsWith('video/')) {
      return NextResponse.json({ 
        error: '不支持的文件类型，请上传视频文件' 
      }, { status: 400 });
    }

    // 获取视频数据
    const videoData = await videoFile.arrayBuffer();
    const videoBase64 = Buffer.from(videoData).toString('base64');
    console.log('视频数据已转换为base64，长度:', videoBase64.length);

    // 创建模型
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // 准备提示词和内容
    const content = {
      contents: [{
        role: 'user',
        parts: [
          { text: mode === 'camera' 
            ? '这是一段摄像头录制的视频。请详细分析视频内容，包括人物、动作、表情、环境等细节。使用中文回复。'
            : '这是一段屏幕录制视频。请详细分析视频内容，包括界面布局、操作流程、显示的内容等。使用中文回复。'
          },
          {
            inlineData: {
              mimeType: videoFile.type,
              data: videoBase64
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    };

    console.log('准备调用 Gemini API');
    
    // 临时替换全局 fetch
    const originalFetch = global.fetch;
    global.fetch = ((url: string | URL | Request, init?: RequestInit) => {
      return customFetch(url.toString(), init, proxyUrl) as unknown as Promise<Response>;
    }) as typeof global.fetch;

    try {
      // 发送请求到 Gemini
      const result = await model.generateContent(content);
      const response = await result.response;
      const reply = response.text();
      console.log('API调用成功，回复长度:', reply.length);
      return NextResponse.json({ reply });
    } finally {
      // 恢复原始 fetch
      global.fetch = originalFetch;
    }
  } catch (error) {
    console.error('视频分析错误:', error);
    
    // 处理特定的错误类型
    if (error instanceof Error) {
      const errorMessage = error.message;
      
      if (errorMessage.includes('fetch failed')) {
        return NextResponse.json({ 
          error: '网络连接错误，请检查代理设置和网络连接。\n错误信息: ' + errorMessage
        }, { status: 500 });
      }
      
      if (errorMessage.includes('API key')) {
        return NextResponse.json({ 
          error: 'API Key 无效或未正确配置' 
        }, { status: 500 });
      }
      
      if (errorMessage.includes('INVALID_ARGUMENT')) {
        return NextResponse.json({ 
          error: '视频格式不支持',
          details: errorMessage
        }, { status: 400 });
      }

      if (errorMessage.includes('timeout')) {
        return NextResponse.json({ 
          error: '请求超时，请检查网络连接和代理设置' 
        }, { status: 500 });
      }
    }
    
    return NextResponse.json(
      { 
        error: '视频分析失败: ' + (error instanceof Error ? error.message : '未知错误'),
        details: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : undefined
      },
      { status: 500 }
    );
  }
} 