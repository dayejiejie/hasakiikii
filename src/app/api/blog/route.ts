import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// 获取博客文章列表或单篇文章
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // 获取单篇文章及其媒体文件
      const post = await prisma.blogPost.findUnique({
        where: { id },
        include: {
          media: true,
          comments: {
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });

      if (!post) {
        return NextResponse.json({ error: '文章不存在', posts: [] }, { status: 404 });
      }

      return NextResponse.json({ post, posts: [post] });
    } else {
      // 获取文章列表
      const posts = await prisma.blogPost.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          media: true,
          _count: {
            select: {
              comments: true
            }
          }
        }
      });

      return NextResponse.json({ posts: posts || [] });
    }
  } catch (error) {
    console.error('获取文章失败:', error);
    return NextResponse.json({ error: '获取文章失败', posts: [] }, { status: 500 });
  }
}

// 创建新文章
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, content, category } = body;

    if (!title || !content || !category) {
      return NextResponse.json({ error: '缺少必要字段' }, { status: 400 });
    }

    // 计算阅读时间（假设每分钟阅读300字）
    const wordCount = content.length;
    const readTime = Math.ceil(wordCount / 300) + ' min';

    // 生成摘要（取前100个字符）
    const excerpt = content.slice(0, 100) + '...';

    const post = await prisma.blogPost.create({
      data: {
        title,
        content,
        category,
        excerpt,
        readTime,
        author: 'admin', // 这里可以根据实际登录用户设置
      }
    });

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error('创建文章失败:', error);
    return NextResponse.json({ error: '创建文章失败', success: false }, { status: 500 });
  }
}

// 更新文章
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();
    const { title, content, category } = body;

    if (!id || !title || !content || !category) {
      return NextResponse.json({ error: '缺少必要字段' }, { status: 400 });
    }

    // 检查文章是否存在
    const existingPost = await prisma.blogPost.findUnique({
      where: { id }
    });

    if (!existingPost) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 });
    }

    // 计算阅读时间
    const wordCount = content.length;
    const readTime = Math.ceil(wordCount / 300) + ' min';

    // 生成摘要
    const excerpt = content.slice(0, 100) + '...';

    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        title,
        content,
        category,
        excerpt,
        readTime,
      }
    });

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error('更新文章失败:', error);
    return NextResponse.json({ error: '更新文章失败', success: false }, { status: 500 });
  }
}

// 删除文章
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '缺少文章ID' }, { status: 400 });
    }

    // 检查文章是否存在
    const existingPost = await prisma.blogPost.findUnique({
      where: { id }
    });

    if (!existingPost) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 });
    }

    await prisma.blogPost.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: '文章删除成功' });
  } catch (error) {
    console.error('删除文章失败:', error);
    return NextResponse.json({ error: '删除文章失败', success: false }, { status: 500 });
  }
} 