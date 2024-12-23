import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// 评论数据文件路径
const COMMENTS_FILE_PATH = path.join(process.cwd(), "public", "comments-data.json");

interface Comment {
  id: number;
  postId: number;
  author: string;
  content: string;
  date: string;
  parentId?: number;
}

// 读取评论数据
async function getCommentsData() {
  try {
    const data = await fs.readFile(COMMENTS_FILE_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    // 如果文件不存在，返回空数组
    return { comments: [] };
  }
}

// 保存评论数据
async function saveCommentsData(data: any) {
  await fs.writeFile(COMMENTS_FILE_PATH, JSON.stringify(data, null, 2));
}

// GET 请求处理 - 获取文章的评论
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");
  
  if (!postId) {
    return NextResponse.json(
      { success: false, error: "缺少文章ID" },
      { status: 400 }
    );
  }
  
  const data = await getCommentsData();
  const comments = data.comments.filter(
    (c: Comment) => c.postId.toString() === postId
  );
  
  return NextResponse.json({ success: true, comments });
}

// POST 请求处理 - 添加新评论
export async function POST(request: Request) {
  try {
    const comment = await request.json();
    const data = await getCommentsData();
    
    // 生成评论ID和创建时间
    const newComment = {
      ...comment,
      id: Date.now(),
      date: new Date().toISOString(),
    };
    
    // 添加新评论到数组
    data.comments.push(newComment);
    
    // 保存更新后的数据
    await saveCommentsData(data);
    
    return NextResponse.json({ success: true, comment: newComment });
  } catch (error) {
    console.error("保存评论失败:", error);
    return NextResponse.json(
      { success: false, error: "保存评论失败" },
      { status: 500 }
    );
  }
} 