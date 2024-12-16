import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// 创建一个全局的prisma实例
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// 获取所有弹幕
export async function GET() {
  try {
    const danmakus = await prisma.danmaku.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // 限制返回最新的50条
    });
    console.log('Fetched danmakus:', danmakus); // 调试日志
    return NextResponse.json(danmakus);
  } catch (error) {
    console.error('Failed to fetch danmakus:', error);
    return NextResponse.json({ error: 'Failed to fetch danmakus' }, { status: 500 });
  }
}

// 创建新弹幕
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received body:', body); // 调试日志

    const danmaku = await prisma.danmaku.create({
      data: {
        text: body.text,
        name: body.name,
        color: body.color,
        top: body.top,
      }
    });

    console.log('Created danmaku:', danmaku); // 调试日志
    return NextResponse.json(danmaku);
  } catch (error) {
    console.error('Failed to create danmaku:', error);
    return NextResponse.json({ error: 'Failed to create danmaku' }, { status: 500 });
  }
}

// 删除所有弹幕
export async function DELETE() {
  try {
    await prisma.danmaku.deleteMany({});
    console.log('Deleted all danmakus'); // 调试日志
    return NextResponse.json({ message: 'All danmakus deleted successfully' });
  } catch (error) {
    console.error('Failed to delete danmakus:', error);
    return NextResponse.json({ error: 'Failed to delete danmakus' }, { status: 500 });
  }
}

// ... existing code ... 