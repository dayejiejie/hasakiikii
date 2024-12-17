import { NextResponse } from 'next/server';
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

// 配置代理
const PROXY_URL = 'http://127.0.0.1:7890';
const proxyAgent = new HttpsProxyAgent(PROXY_URL);

export async function GET() {
  try {
    console.log('开始获取可用模型列表');
    console.log('使用代理:', PROXY_URL);
    
    // 获取模型列表
    const listResponse = await fetch('https://generativelanguage.googleapis.com/v1/models', {
      method: 'GET',
      headers: {
        'x-goog-api-key': 'AIzaSyAP76BRotR45wuYxphW0vaIzMfaGtpiex0',
      },
      agent: proxyAgent
    });

    if (!listResponse.ok) {
      const errorData = await listResponse.json();
      throw new Error(`获取模型列表失败: ${JSON.stringify(errorData)}`);
    }

    const modelList = await listResponse.json();
    console.log('可用模型列表:', modelList);

    // 测试连接到 Google API
    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': 'AIzaSyAP76BRotR45wuYxphW0vaIzMfaGtpiex0',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: '你好，这是一个测试消息。' }]
        }]
      }),
      agent: proxyAgent
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API 请求失败: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('API 响应:', data);

    return NextResponse.json({ 
      status: 'success',
      message: '连接测试成功',
      models: modelList,
      data: data
    });
    
  } catch (error) {
    console.error('测试失败:', error);
    return NextResponse.json({ 
      status: 'error',
      message: '连接测试失败: ' + (error instanceof Error ? error.message : '未知错误'),
      details: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    }, { 
      status: 500 
    });
  }
} 