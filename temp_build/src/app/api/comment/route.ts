import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 获取评论列表
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json({ error: '缺少文章ID' }, { status: 400 });
    }

    const comments = await prisma.comment.findMany({
      where: { postId },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ success: true, comments });
  } catch (error) {
    console.error('获取评论失败:', error);
    return NextResponse.json({ error: '获取评论失败', success: false }, { status: 500 });
  }
}

// 创建新评论
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, author, postId } = body;

    if (!content || !author || !postId) {
      return NextResponse.json({ error: '缺少必要字段' }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        author,
        postId
      }
    });

    return NextResponse.json({ success: true, comment });
  } catch (error) {
    console.error('创建评论失败:', error);
    return NextResponse.json({ error: '创建评论失败', success: false }, { status: 500 });
  }
}

// 删除评论
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '缺少评论ID' }, { status: 400 });
    }

    await prisma.comment.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: '评论删除成功' });
  } catch (error) {
    console.error('删除评论失败:', error);
    return NextResponse.json({ error: '删除评论失败', success: false }, { status: 500 });
  }
} 