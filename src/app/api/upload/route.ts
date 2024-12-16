import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 新的配置方式
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    console.log('开始处理文件上传...');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.error('没有找到上传的文件');
      return NextResponse.json({ error: '没有文件被上传' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      return NextResponse.json({ error: '文件大小超过限制' }, { status: 400 });
    }

    console.log('文件信息:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // 获取文件扩展名
    const originalName = file.name;
    const ext = originalName.split('.').pop() || '';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

    // 将文件转换为 Base64 字符串
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString('base64');

    // 创建一个临时的 data URL
    const dataUrl = `data:${file.type};base64,${base64Data}`;

    // 保存文件信息到数据库，不关联到文章
    const media = await prisma.media.create({
      data: {
        type: file.type,
        url: dataUrl,
        filename: fileName,
        originalName: file.name
      }
    });

    return NextResponse.json({
      success: true,
      file: {
        id: media.id,
        filename: fileName,
        url: dataUrl,
        type: file.type
      }
    });
  } catch (error) {
    console.error('文件上传失败:', error);
    return NextResponse.json(
      { error: '文件上传失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
} 