import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// 文章数据文件路径
const DATA_FILE_PATH = path.join(process.cwd(), "public", "blog-data.json");

// 读取文章数据
async function getBlogData() {
  try {
    const data = await fs.readFile(DATA_FILE_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    // 如果文件不存在，返回空数组
    return { posts: [] };
  }
}

// 保存文章数据
async function saveBlogData(data: any) {
  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2));
}

// GET 请求处理 - 获取所有文章或单篇文章
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  
  const data = await getBlogData();
  
  if (id) {
    const post = data.posts.find((p: any) => p.id.toString() === id);
    if (!post) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }
    return NextResponse.json(post);
  }
  
  return NextResponse.json(data);
}

// POST 请求处理 - 保存新文章
export async function POST(request: Request) {
  try {
    const article = await request.json();
    const data = await getBlogData();
    
    // 生成文章ID和创建时间
    const newArticle = {
      ...article,
      id: Date.now(),
      date: new Date().toISOString(),
      readTime: Math.ceil(article.content.length / 500) + " min"
    };
    
    // 添加新文章到数组开头
    data.posts = [newArticle, ...data.posts];
    
    // 保存更新后的数据
    await saveBlogData(data);
    
    return NextResponse.json({ success: true, article: newArticle });
  } catch (error) {
    console.error("保存文章失败:", error);
    return NextResponse.json(
      { success: false, error: "保存文章失败" },
      { status: 500 }
    );
  }
}

// PUT 请求处理 - 更新文章
export async function PUT(request: Request) {
  try {
    const article = await request.json();
    const data = await getBlogData();
    
    const index = data.posts.findIndex((p: any) => p.id === article.id);
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: "文章不存在" },
        { status: 404 }
      );
    }
    
    // 更新文章，保持原有的ID和创建时间
    const updatedArticle = {
      ...data.posts[index],
      ...article,
      readTime: Math.ceil(article.content.length / 500) + " min"
    };
    
    data.posts[index] = updatedArticle;
    await saveBlogData(data);
    
    return NextResponse.json({ success: true, article: updatedArticle });
  } catch (error) {
    console.error("更新文章失败:", error);
    return NextResponse.json(
      { success: false, error: "更新文章失败" },
      { status: 500 }
    );
  }
}

// DELETE 请求处理 - 删除文章
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: "缺少文章ID" },
        { status: 400 }
      );
    }
    
    const data = await getBlogData();
    const index = data.posts.findIndex((p: any) => p.id.toString() === id);
    
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: "文章不存在" },
        { status: 404 }
      );
    }
    
    // 删除文章
    data.posts.splice(index, 1);
    await saveBlogData(data);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除文章失败:", error);
    return NextResponse.json(
      { success: false, error: "删除文章失败" },
      { status: 500 }
    );
  }
} 