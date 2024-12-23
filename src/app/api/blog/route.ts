import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('接收到的文章数据:', {
      title: data.title ? '✅ 标题已接收' : '❌ 标题缺失',
      category: data.category ? '✅ 分类已接收' : '❌ 分类缺失',
      author: data.author ? '✅ 作者已接收' : '❌ 作者缺失',
      contentLength: data.content ? `✅ 内容长度: ${data.content.length}字符` : '❌ 内容缺失'
    });
    
    // 验证必需字段
    if (!data.title || !data.content || !data.category || !data.author) {
      console.log('❌ 数据验证失败: 缺少必要字段');
      return NextResponse.json(
        { error: '标题、内容、分类和作者为必填项' },
        { status: 400 }
      );
    }

    // 分析内容中的媒体元素
    const imageCount = (data.content.match(/<img[^>]+>/g) || []).length;
    const videoCount = (data.content.match(/<video[^>]+>/g) || []).length;
    const textContent = data.content.replace(/<[^>]+>/g, '').trim();

    console.log('内容分析:', {
      images: `✅ 包含 ${imageCount} 个图片元素`,
      videos: `✅ 包含 ${videoCount} 个视频元素`,
      text: `✅ 包含 ${textContent.length} 字符的纯文本`
    });

    // 创建文章
    const post = await prisma.blogPost.create({
      data: {
        title: data.title,
        content: data.content,
        category: data.category,
        author: data.author,
        excerpt: data.content.slice(0, 200) + '...',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('数据库存储结果:', {
      postId: `✅ 文章ID: ${post.id}`,
      title: '✅ 标题已存储',
      category: '✅ 分类已存储',
      author: '✅ 作者已存储',
      content: '✅ 内容已存储',
      timestamp: `✅ 创建时间: ${post.createdAt.toLocaleString()}`
    });

    return NextResponse.json({ 
      success: true, 
      post,
      storage: {
        title: true,
        category: true,
        author: true,
        mediaElements: {
          images: imageCount,
          videos: videoCount
        },
        textContent: textContent.length > 0
      }
    });
  } catch (error) {
    console.error('❌ 创建文章失败:', error);
    return NextResponse.json(
      { error: '创建文章失败' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // 获取单篇文章
      const post = await prisma.blogPost.findUnique({
        where: { id },
        include: {
          media: true,
        },
      });

      if (!post) {
        return NextResponse.json(
          { error: '文章不存在' },
          { status: 404 }
        );
      }

      return NextResponse.json({ post });
    } else {
      // 获取所有文章
      const posts = await prisma.blogPost.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          media: true,
        },
      });

      return NextResponse.json({ posts });
    }
  } catch (error) {
    console.error('获取文章失败:', error);
    return NextResponse.json(
      { error: '获取文章失败' },
      { status: 500 }
    );
  }
}

// 更新博客文章
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    console.log('接收到的更新数据:', {
      id: data.id ? '✅ ID已接收' : '❌ ID缺失',
      title: data.title ? '✅ 标题已接收' : '❌ 标题缺失',
      category: data.category ? '✅ 分类已接收' : '❌ 分类缺失',
      author: data.author ? '✅ 作者已接收' : '❌ 作者缺失',
      contentLength: data.content ? `✅ 内容长度: ${data.content.length}字符` : '❌ 内容缺失'
    });

    if (!data.id || !data.title || !data.content || !data.category || !data.author) {
      console.log('❌ 数据验证失败: 缺少必要字段');
      return NextResponse.json(
        { error: 'ID、标题、内容、分类和作者为必填项' },
        { status: 400 }
      );
    }

    // 分析内容中的媒体元素
    const imageCount = (data.content.match(/<img[^>]+>/g) || []).length;
    const videoCount = (data.content.match(/<video[^>]+>/g) || []).length;
    const textContent = data.content.replace(/<[^>]+>/g, '').trim();

    console.log('内容分析:', {
      images: `✅ 包含 ${imageCount} 个图片元素`,
      videos: `✅ 包含 ${videoCount} 个视频元素`,
      text: `✅ 包含 ${textContent.length} 字符的纯文本`
    });

    // 更新文章
    const post = await prisma.blogPost.update({
      where: { id: data.id },
      data: {
        title: data.title,
        content: data.content,
        category: data.category,
        author: data.author,
        excerpt: data.content.slice(0, 200) + '...',
        updatedAt: new Date(),
      },
    });

    console.log('数据库更新结果:', {
      postId: `✅ 文章ID: ${post.id}`,
      title: '✅ 标题已更新',
      category: '✅ 分类已更新',
      author: '✅ 作者已更新',
      content: '✅ 内容已更新',
      timestamp: `✅ 更新时间: ${post.updatedAt.toLocaleString()}`
    });

    return NextResponse.json({ 
      success: true, 
      post,
      storage: {
        title: true,
        category: true,
        author: true,
        mediaElements: {
          images: imageCount,
          videos: videoCount
        },
        textContent: textContent.length > 0
      }
    });
  } catch (error) {
    console.error('❌ 更新文章失败:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: '文章不存在' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: `数据库错误: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: '更新文章失败' },
      { status: 500 }
    );
  }
}

// 删除博客文章
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    console.log('接收到删除请求:', { id });

    if (!id) {
      console.log('❌ 删除失败: 缺少文章ID');
      return NextResponse.json(
        { success: false, error: '缺少文章ID' },
        { status: 400 }
      );
    }

    // 首先检查文章是否存在
    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        media: true,
        comments: true
      }
    });

    if (!existingPost) {
      console.log('❌ 删除失败: 文章不存在');
      return NextResponse.json(
        { success: false, error: '文章不存在' },
        { status: 404 }
      );
    }

    console.log('开始删除文章相关数据:', {
      id: existingPost.id,
      title: existingPost.title,
      mediaCount: existingPost.media.length,
      commentCount: existingPost.comments.length
    });

    // 使用事务确保数据一致性
    await prisma.$transaction(async (tx) => {
      // 1. 删除相关的评论
      await tx.comment.deleteMany({
        where: { postId: id }
      });
      console.log('✅ 已删除相关评论');

      // 2. 删除相关的媒体文件
      await tx.media.deleteMany({
        where: { postId: id }
      });
      console.log('✅ 已删除相关媒体文件');

      // 3. 删除文章本身
      await tx.blogPost.delete({
        where: { id }
      });
      console.log('✅ 已删除文章');
    });

    console.log('✅ 文章删除成功');
    return NextResponse.json({ 
      success: true,
      message: '文章删除成功',
      deletedId: id
    });

  } catch (error) {
    console.error('❌ 删除文章失败:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { success: false, error: `数据库错误: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { success: false, error: '删除文章失败' },
      { status: 500 }
    );
  }
} 