import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 允许的文件类型
const ALLOWED_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/ogg': 'ogg'
};

const MAX_FILE_SIZE = {
  image: 5 * 1024 * 1024, // 5MB for images
  video: 100 * 1024 * 1024 // 100MB for videos
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const postId = formData.get('postId') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: '没有找到文件' },
        { status: 400 }
      );
    }

    // 检查文件类型
    if (!ALLOWED_TYPES[file.type as keyof typeof ALLOWED_TYPES]) {
      return NextResponse.json(
        { error: '不支持的文件类型' },
        { status: 400 }
      );
    }

    // 检查文件大小
    const maxSize = file.type.startsWith('video/') ? MAX_FILE_SIZE.video : MAX_FILE_SIZE.image;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `文件大小不能超过 ${maxSize / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // 生成唯一文件名
    const ext = ALLOWED_TYPES[file.type as keyof typeof ALLOWED_TYPES];
    const fileName = `${uuidv4()}.${ext}`;
    
    // 确定存储目录
    const mediaType = file.type.startsWith('video/') ? 'videos' : 'images';
    const directory = join(process.cwd(), 'public', 'uploads', mediaType);
    const filePath = join(directory, fileName);

    // 将文件写入服务器
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // 生成文件URL
    const fileUrl = `/uploads/${mediaType}/${fileName}`;
    
    // 保存到数据库，如果有 postId 则关联到文章
    const media = await prisma.media.create({
      data: {
        type: file.type,
        url: fileUrl,
        filename: fileName,
        originalName: file.name,
        postId: postId || undefined // 如果有 postId 则关联，否则为 undefined
      }
    });
    
    return NextResponse.json({
      success: true,
      url: fileUrl,
      type: file.type,
      mediaId: media.id
    });
  } catch (error) {
    console.error('文件上传失败:', error);
    return NextResponse.json(
      { error: '文件上传失败' },
      { status: 500 }
    );
  }
} 