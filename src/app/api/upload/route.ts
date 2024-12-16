import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// 确保上传目录存在
const uploadDir = join(process.cwd(), 'public', 'uploads');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

export async function POST(request: Request) {
  try {
    console.log('开始处理文件上传...');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const postId = formData.get('postId') as string;

    if (!file) {
      console.error('没有找到上传的文件');
      return NextResponse.json({ error: '没有文件被上传' }, { status: 400 });
    }

    console.log('文件信息:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    let fileName: string;
    let fileUrl: string;

    try {
      // 生成文件名
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // 获取文件扩展名
      const originalName = file.name;
      const ext = originalName.split('.').pop() || '';
      fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      
      console.log('准备保存文件:', fileName);
      
      // 保存文件
      const filePath = join(uploadDir, fileName);
      await writeFile(filePath, buffer);
      
      console.log('文件已保存到:', filePath);
      
      // 文件URL
      fileUrl = `/uploads/${fileName}`;
      
      console.log('文件保存成功，URL:', fileUrl);
    } catch (fileError) {
      console.error('文件保存失败:', fileError);
      return NextResponse.json(
        { 
          error: '文件保存失败', 
          details: fileError instanceof Error ? fileError.message : '未知错误',
          success: false 
        },
        { status: 500 }
      );
    }

    try {
      console.log('准备保存到数据库，数据:', {
        filename: fileName,
        originalName: file.name,
        url: fileUrl,
        type: file.type.startsWith('image/') ? 'image' : 'video',
        postId: postId.startsWith('temp-') ? null : postId,
      });
      
      // 保存文件信息到数据库
      const media = await prisma.media.create({
        data: {
          filename: fileName,
          originalName: file.name,
          url: fileUrl,
          type: file.type.startsWith('image/') ? 'image' : 'video',
          postId: postId.startsWith('temp-') ? null : postId,
        },
      });

      console.log('文件信息已保存到数据库:', media);

      return NextResponse.json({
        success: true,
        url: fileUrl,
        type: media.type,
      });
    } catch (dbError) {
      console.error('数据库保存失败:', dbError);
      // 如果数据库保存失败，返回具体错误
      return NextResponse.json(
        { 
          error: '数据库保存失败', 
          details: dbError instanceof Error ? dbError.message : '未知错误',
          success: false 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('文件上传失败，详细错误:', error);
    return NextResponse.json(
      { 
        error: '文件上传处理失败', 
        details: error instanceof Error ? error.message : '未知错误',
        success: false 
      },
      { status: 500 }
    );
  }
} 