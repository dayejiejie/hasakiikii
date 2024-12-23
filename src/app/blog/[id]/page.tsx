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
  coverImage?: {
    url: string;
  };
}

interface TreeNode {
  type: string;
  children?: TreeNode[];
  tagName?: string;
  properties?: {
    src?: string;
    alt?: string;
    [key: string]: any;
  };
  url?: string;
  alt?: string;
}

interface MediaItem {
  id: string;
  type: string;
  url: string;
  filename: string;
  originalName: string;
}

// 自定义的 remark 插件，用于处理图片
const customImagePlugin = () => {
  return (tree: TreeNode) => {
    const visit = (node: TreeNode) => {
      const children = node.children || [];
      if (node.type === 'paragraph' && children.length > 0) {
        children.forEach((child: TreeNode, index: number) => {
          if (child.type === 'image') {
            const imageNode: TreeNode = {
              type: 'element',
              tagName: 'img',
              properties: {
                src: child.url || '',
                alt: child.alt || '',
              },
            };
            children[index] = imageNode;
          }
        });
      }
      children.forEach(visit);
    };
    visit(tree);
    return tree;
  };
};

// 计算阅读时间的函数
function calculateReadTime(content: string): string {
  // 移除 Markdown 标记
  const plainText = content
    .replace(/!\[.*?\]\(.*?\)/g, '') // 移除图片
    .replace(/\[.*?\]\(.*?\)/g, '') // 移除链接
    .replace(/#{1,6}\s+/g, '') // 移除标题
    .replace(/\*\*|__/g, '') // 移除加粗
    .replace(/\*|_/g, '') // 移除斜体
    .replace(/`{1,3}[\s\S]*?`{1,3}/g, ''); // 移除代码块

  // 计算字数
  const wordCount = plainText.trim().split(/\s+/).length;
  // 假设平均阅读速度为每分钟 300 字
  const minutes = Math.ceil(wordCount / 300);
  return `${minutes} min`;
}

// 格式化日期的函数
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function BlogPostPage() {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { id } = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [authAction, setAuthAction] = useState<'edit' | 'delete' | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;

      try {
        setLoading(true);
        // 获取文章内容
        const response = await fetch(`/api/blog?id=${id}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || '获取文章失败');
        }

        if (data.post) {
          const mediaUrls = (data.post.media || []).map((m: MediaItem) => m.url);
          const postData = {
            ...data.post,
            date: formatDate(data.post.createdAt),
            readTime: `${data.post.readCount || 0} 次阅读`,
            media: data.post.media || []
          };
          setPost(postData);

          // 增加阅读次数
          await fetch(`/api/blog/read?id=${id}`, {
            method: 'POST'
          });
        } else {
          throw new Error('文章不存在');
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        setError(error instanceof Error ? error.message : '获取文章失败');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  const handleDelete = async () => {
    if (!post || isDeleting) return;
    
    setIsDeleting(true);
    try {
      console.log('开始删除文章:', post.id);
      const response = await fetch(`/api/blog?id=${post.id}`, {
        method: "DELETE",
      });
      
      const data = await response.json();
      console.log('删除响应:', data);

      if (!response.ok) {
        throw new Error(data.error || "删除失败");
      }

      if (!data.success) {
        throw new Error(data.error || "删除失败");
      }

      console.log('文章删除成功，准备跳转到博客列表页');
      router.push("/blog");
    } catch (error) {
      console.error("删除文章失败:", error);
      const errorMessage = error instanceof Error ? error.message : "删除失败";
      console.error('错误详情:', errorMessage);
      alert(errorMessage);
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

    return (
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <div 
          className="markdown-content"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>
    );
  };

  if (loading) {
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
              <span>{post.date}</span>
              <span>•</span>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {post.category}
              </span>
              <span>•</span>
              <span>{post.readTime}</span>
            </div>
          </div>

          {/* 文章内容 */}
          <div className="prose prose-lg mx-auto dark:prose-invert">
            <style jsx global>{`
              .markdown-content img {
                max-width: 100%;
                height: auto;
                border-radius: 0.5rem;
                margin: 2rem auto;
                display: block;
              }
              .markdown-content video {
                max-width: 100%;
                height: auto;
                border-radius: 0.5rem;
                margin: 2rem auto;
                display: block;
              }
              .markdown-content p {
                margin-bottom: 1rem;
                line-height: 1.8;
              }
            `}</style>
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