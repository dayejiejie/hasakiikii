import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// 缓存弹幕数据
let cachedDanmakus: any[] | null = null;
let lastCacheTime = 0;
const CACHE_DURATION = 5000; // 缓存 5 秒

// 获取所有弹幕
export async function GET() {
  try {
    // 如果缓存存在且未过期，直接返回缓存数据
    const now = Date.now();
    if (cachedDanmakus && (now - lastCacheTime) < CACHE_DURATION) {
      return NextResponse.json(cachedDanmakus);
    }

    // 从数据库获取最新的弹幕
    const danmakus = await prisma.danmaku.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 30, // 限制只返回最新的 30 条
      select: {
        id: true,
        text: true,
        name: true,
        color: true,
        top: true,
        createdAt: true
      }
    });

    // 更新缓存
    cachedDanmakus = danmakus;
    lastCacheTime = now;

    return NextResponse.json(danmakus);
  } catch (error) {
    console.error('Failed to fetch danmakus:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// 创建新弹幕
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 验证必需字段
    if (!body.text?.trim()) {
      return NextResponse.json(
        { error: '弹幕内容不能为空' },
        { status: 400 }
      );
    }

    const danmaku = await prisma.danmaku.create({
      data: {
        text: body.text.trim(),
        name: body.name || '匿名',
        color: body.color || '#ffffff',
        top: body.top || Math.random() * 80 + 10, // 10-90 之间的随机数
      }
    });

    // 清除缓存，确保下次获取时能看到新弹幕
    cachedDanmakus = null;

    return NextResponse.json(danmaku);
  } catch (error) {
    console.error('Failed to create danmaku:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// 删除所有弹幕
export async function DELETE() {
  try {
    await prisma.danmaku.deleteMany({});
    return NextResponse.json({ message: 'All danmakus deleted successfully' });
  } catch (error) {
    console.error('Failed to delete danmakus:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// ... existing code ... 