"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Comments } from "@/components/comments/Comments";
import { AdminAuth } from "@/components/AdminAuth/AdminAuth";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import Image from 'next/image';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  date: string;
  category: string;
  readTime: string;
  createdAt?: string;
  media?: Array<{
    id: string;
    type: string;
    url: string;
    filename: string;
    originalName: string;
  }>;
}

// 自定义的 remark 插件，用于处理图片
const customImagePlugin = () => {
  return (tree) => {
    const images = [];
    const visit = (node) => {
      if (node.type === 'paragraph' && node.children) {
        node.children.forEach((child, index) => {
          if (child.type === 'image') {
            // 提取图片的 URL 和 alt 文本
            const imageNode = {
              type: 'element',
              tagName: 'img',
              properties: {
                src: child.url,
                alt: child.alt || '',
              },
            };
            node.children[index] = imageNode;
          }
        });
      }
      if (node.children) {
        node.children.forEach(visit);
      }
    };
    visit(tree);
    return tree;
  };
};

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [authAction, setAuthAction] = useState<'edit' | 'delete' | null>(null);

  useEffect(() => {
    fetchPost();
  }, []);

  const fetchPost = async () => {
    try {
      console.log('开始获取文章:', params.id);
      const response = await fetch(`/api/blog?id=${params.id}`);
      
      if (!response.ok) {
        console.error('获取文章失败:', response.status, response.statusText);
        throw new Error("文章不存在");
      }
      
      const data = await response.json();
      console.log('获取到的原始数据:', {
        post: {
          ...data.post,
          content: data.post?.content?.length + ' 字符'  // 只显示长度
        },
        hasPost: !!data.post,
        mediaCount: data.post?.media?.length
      });
      
      const post = data.post;
      if (!post) {
        console.error('文章数据为空');
        throw new Error("文章不存在");
      }

      console.log('处理后的文章数据:', {
        id: post.id,
        title: post.title,
        contentLength: post.content?.length,
        hasMedia: post.media?.length > 0,
        mediaItems: post.media?.map(m => ({
          id: m.id,
          type: m.type,
          url: m.url,
          filename: m.filename
        }))
      });
      
      // 检查 content 中的 markdown 图片语法
      const imageMarkdownRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
      const imageMatches = Array.from(post.content.matchAll(imageMarkdownRegex));
      console.log('找到图片引用数量:', imageMatches.length);
      
      setPost({
        ...post,
        date: post.createdAt,
        content: post.content,
        media: post.media
      });
    } catch (error) {
      console.error("获取文章失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!post || isDeleting) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/blog?id=${post.id}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        router.push("/blog");
      } else {
        throw new Error("删除失败");
      }
    } catch (error) {
      console.error("删除文章失败:", error);
      alert("删除文章失败");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleEditClick = () => {
    setAuthAction('edit');
    setShowAdminAuth(true);
  };

  const handleDeleteClick = () => {
    setAuthAction('delete');
    setShowAdminAuth(true);
  };

  const handleAuthSuccess = () => {
    setShowAdminAuth(false);
    if (authAction === 'edit') {
      router.push(`/blog/edit/${post?.id}`);
    } else if (authAction === 'delete') {
      setShowDeleteConfirm(true);
    }
  };

  const handleAuthCancel = () => {
    setShowAdminAuth(false);
    setAuthAction(null);
  };

  const renderContent = () => {
    if (!post?.content) return null;

    // 检查文章内容中的媒体引用
    const mediaUrls = post.media?.map(m => m.url) || [];
    console.log('开始渲染文章内容，长度:', post.content.length);

    // 预处理 Markdown 内容，将图片标记转换为 HTML
    let processedContent = post.content;
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const matches = Array.from(processedContent.matchAll(imageRegex));
    
    console.log('找到图片标记数量:', matches.length);
    
    matches.forEach((match, index) => {
      const [fullMatch, alt, src] = match;
      console.log(`处理第 ${index + 1} 个图片:`, { alt });
      
      const imgHtml = src.startsWith('data:') 
        ? `<img src="${src}" alt="${alt}" class="max-w-full h-auto rounded-lg shadow-lg" style="max-height: 600px; object-fit: contain;" loading="lazy" />`
        : `<img src="${src}" alt="${alt}" class="max-w-full h-auto rounded-lg shadow-lg" style="max-height: 600px; object-fit: contain;" loading="lazy" />`;
        
      processedContent = processedContent.replace(fullMatch, `<div class="flex justify-center my-4">${imgHtml}</div>`);
    });

    // 将其他 Markdown 语法转换为 HTML
    const htmlContent = processedContent
      .replace(/#{3,6}\s+([^\n]+)/g, '<h3 class="text-xl font-bold mb-2">$1</h3>') // h3-h6
      .replace(/##\s+([^\n]+)/g, '<h2 class="text-2xl font-bold mb-3">$1</h2>') // h2
      .replace(/#\s+([^\n]+)/g, '<h1 class="text-3xl font-bold mb-4">$1</h1>') // h1
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') // bold
      .replace(/\*([^*]+)\*/g, '<em>$1</em>') // italic
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-800 rounded px-2 py-1 text-sm font-mono">$1</code>') // inline code
      .replace(/\n\n/g, '</p><p class="mb-4">') // paragraphs
      .replace(/\n/g, '<br/>'); // line breaks

    return (
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <div
          dangerouslySetInnerHTML={{
            __html: `<div class="markdown-content">${htmlContent}</div>`
          }}
        />
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="h-32 w-32 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <h1 className="mb-4 text-2xl font-bold text-gray-800 dark:text-white">
          文章不存在
        </h1>
        <Link
          href="/blog"
          className="text-blue-500 hover:text-blue-600 dark:text-blue-400"
        >
          返回博客列表
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* 顶部导航栏 */}
      <nav className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-md dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/blog"
              className="text-2xl font-bold text-gray-800 dark:text-white"
            >
              返回博客
            </Link>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleEditClick}
                className="rounded-full bg-blue-500 px-6 py-2 text-sm font-medium text-white hover:bg-blue-600"
              >
                编辑文章
              </button>
              <button
                onClick={handleDeleteClick}
                className="rounded-full bg-red-500 px-6 py-2 text-sm font-medium text-white hover:bg-red-600"
                disabled={isDeleting}
              >
                {isDeleting ? "删除中..." : "删除文章"}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 文章内容 */}
      <main className="container mx-auto px-4 pt-24">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-3xl"
        >
          {/* 文章头部信息 */}
          <div className="mb-8 text-center">
            <h1 className="mb-4 text-4xl font-bold text-gray-800 dark:text-white">
              {post.title}
            </h1>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <span>{new Date(post.date).toLocaleDateString()}</span>
              <span>•</span>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {post.category}
              </span>
              <span>•</span>
              <span>{post.readTime} 阅读</span>
            </div>
          </div>

          {/* 文章内容 */}
          <div className="prose prose-lg mx-auto dark:prose-invert">
            {renderContent()}
          </div>

          {/* 评论区 */}
          <div className="mt-16">
            <Comments postId={post.id} />
          </div>
        </motion.article>
      </main>

      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-[400px] rounded-lg bg-white p-6 dark:bg-gray-800"
          >
            <h3 className="mb-4 text-xl font-bold text-gray-800 dark:text-white">
              确认删除
            </h3>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              确定要删除这篇文章吗？此操作无法撤销。
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? "删除中..." : "确认删除"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 管理员验证对话框 */}
      {showAdminAuth && (
        <AdminAuth
          onSuccess={handleAuthSuccess}
          onCancel={handleAuthCancel}
        />
      )}
    </div>
  );
} 