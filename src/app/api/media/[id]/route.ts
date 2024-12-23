import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { postId } = await request.json();

    if (!id || !postId) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 更新媒体文件的文章关联
    const media = await prisma.media.update({
      where: { id },
      data: { postId }
    });

    return NextResponse.json({ success: true, media });
  } catch (error) {
    console.error('更新媒体文件关联失败:', error);
    return NextResponse.json(
      { error: '更新媒体文件关联失败' },
      { status: 500 }
    );
  }
} 