import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// 获取博客文章列表或单篇文章
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      console.log('获取单篇文章:', id); // 调试日志
      
      const post = await prisma.blogPost.findUnique({
        where: { id },
        include: {
          media: {
            select: {
              id: true,
              type: true,
              url: true,
              filename: true,
              originalName: true
            }
          },
          comments: {
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });

      if (!post) {
        console.log('文章不存在:', id); // 调试日志
        return NextResponse.json(
          { error: '文章不存在', posts: [] },
          { status: 404 }
        );
      }

      console.log('文章数据:', {
        id: post.id,
        title: post.title,
        hasContent: !!post.content,
        mediaCount: post.media.length
      }); // 调试日志

      return NextResponse.json({ post, posts: [post] });
    }

    const posts = await prisma.blogPost.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        media: {
          select: {
            id: true,
            type: true,
            url: true,
            filename: true,
            originalName: true
          }
        },
        _count: {
          select: {
            comments: true
          }
        }
      }
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('获取文章失败:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: `数据库错误: ${error.message}`, posts: [] },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: '获取文章失败', posts: [] },
      { status: 500 }
    );
  }
}

// 创建或更新博客文章
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!data.title?.trim() || !data.content?.trim()) {
      return NextResponse.json(
        { success: false, error: '标题和内容不能为空' },
        { status: 400 }
      );
    }

    const post = await prisma.$transaction(async (tx) => {
      return tx.blogPost.upsert({
        where: { id: id || '' },
        update: {
          ...data,
          updatedAt: new Date()
        },
        create: {
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    });

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error('保存文章失败:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { success: false, error: `数据库错误: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { success: false, error: '保存文章失败' },
      { status: 500 }
    );
  }
}

// 创建新博客文章
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('收到的文章数据:', body);
    
    // 验证必需字段
    const requiredFields = ['title', 'content', 'category', 'author'];
    const missingFields = requiredFields.filter(field => !body[field]?.trim());
    
    if (missingFields.length > 0) {
      console.log('缺少必需字段:', missingFields);
      return NextResponse.json(
        { success: false, error: `缺少必需字段: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    console.log('开始创建文章...');
    const newPost = await prisma.blogPost.create({
      data: {
        title: body.title.trim(),
        content: body.content.trim(),
        category: body.category,
        author: body.author,
        readTime: body.readTime || '1 分钟',
        excerpt: body.excerpt || body.content.slice(0, 100) + '...',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log('文章创建成功:', newPost);
    return NextResponse.json({ success: true, post: newPost });
  } catch (error) {
    console.error('创建文章失败，详细错误:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('Prisma错误代码:', error.code);
      console.error('Prisma错误信息:', error.message);
      console.error('Prisma错误元数据:', error.meta);
      return NextResponse.json(
        { success: false, error: `数据库错误: ${error.message}`, details: error.meta },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '创建文章失败',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// 删除博客文章
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少文章ID' },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // 首先检查文章是否存在
      const post = await tx.blogPost.findUnique({
        where: { id }
      });

      if (!post) {
        throw new Error('文章不存在');
      }

      // 删除相关的评论和媒体文件
      await tx.comment.deleteMany({
        where: { postId: id }
      });

      await tx.media.deleteMany({
        where: { postId: id }
      });

      await tx.blogPost.delete({
        where: { id }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除文章失败:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { success: false, error: `数据库错误: ${error.message}` },
        { status: 500 }
      );
    }
    if (error instanceof Error && error.message === '文章不存在') {
      return NextResponse.json(
        { success: false, error: '文章不存在' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: '删除文章失败' },
      { status: 500 }
    );
  }
} 