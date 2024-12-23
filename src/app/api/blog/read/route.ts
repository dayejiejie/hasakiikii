import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "文章ID不能为空" }, { status: 400 });
    }

    // 增加阅读次数
    const updatedPost = await prisma.blogPost.update({
      where: { id },
      data: {
        readCount: {
          increment: 1
        }
      }
    });

    return NextResponse.json({ success: true, readCount: updatedPost.readCount });
  } catch (error) {
    console.error("增加阅读次数失败:", error);
    return NextResponse.json({ error: "增加阅读次数失败" }, { status: 500 });
  }
} 