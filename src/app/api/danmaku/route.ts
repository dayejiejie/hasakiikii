import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// 获取所有弹幕
export async function GET() {
  try {
    const danmakus = await prisma.danmaku.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // 限制返回最新的50条
    });
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
    const danmaku = await prisma.danmaku.create({
      data: {
        text: body.text,
        name: body.name,
        color: body.color,
        top: body.top,
      }
    });
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