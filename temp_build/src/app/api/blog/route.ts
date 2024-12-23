import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// 获取博客文章列表或单篇文章
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      console.log('获取单篇文章:', id);
      
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
        console.log('文章不存在:', id);
        return NextResponse.json(
          { error: '文章不存在' },
          { status: 404 }
        );
      }

      // 检查文章内容中的媒体引用
      const mediaUrls = post.media.map(m => m.url);
      console.log('文章媒体数据:', {
        id: post.id,
        title: post.title,
        mediaCount: post.media.length,
        mediaUrls: mediaUrls,
        contentLength: post.content.length,
        hasMediaInContent: mediaUrls.some(url => post.content.includes(url))
      });

      return NextResponse.json({ post });
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

    // 为每篇文章生成摘要，并处理媒体信息
    const processedPosts = posts.map(post => {
      // 从 Markdown 内容中提取纯文本和媒体 URL
      const textContent = post.content
        .replace(/!\[.*?\]\(.*?\)/g, '') // 移除图片标记
        .replace(/\[.*?\]\(.*?\)/g, '') // 移除链接标记
        .replace(/#{1,6}\s+/g, '') // 移除标题标记
        .replace(/\*\*|__/g, '') // 移除加粗标记
        .replace(/\*|_/g, '') // 移除斜体标记
        .replace(/`{1,3}[\s\S]*?`{1,3}/g, ''); // 移除代码块

      // 从 Markdown 内容中提取第一个图片或视频的 URL
      let firstMediaUrl = null;
      let mediaType = null;

      // 查找图片
      const imageMatch = post.content.match(/!\[.*?\]\((.*?)\)/);
      if (imageMatch) {
        firstMediaUrl = imageMatch[1];
        mediaType = 'image';
      }

      // 查找视频
      const videoMatch = post.content.match(/<video.*?src="(.*?)"/);
      if (!firstMediaUrl && videoMatch) {
        firstMediaUrl = videoMatch[1];
        mediaType = 'video';
      }

      // 如果在内容中找到了媒体 URL，创建一个媒体对象
      const media = firstMediaUrl ? [{
        id: 'inline-media-1',
        type: mediaType === 'image' ? 'image/jpeg' : 'video/mp4',
        url: firstMediaUrl,
        filename: firstMediaUrl.split('/').pop() || 'media',
        originalName: firstMediaUrl.split('/').pop() || 'media'
      }] : [];

      return {
        ...post,
        excerpt: textContent.slice(0, 100) + "...",
        date: post.createdAt,
        media: media
      };
    });

    return NextResponse.json({ posts: processedPosts });
  } catch (error) {
    console.error('获取文章列表失败:', error);
    return NextResponse.json(
      { error: '获取文章列表失败' },
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