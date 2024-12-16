"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Comments } from "@/components/comments/Comments";
import { AdminAuth } from "@/components/AdminAuth/AdminAuth";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  date: string;
  category: string;
  readTime: string;
  createdAt?: string;
}

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
      const response = await fetch(`/api/blog?id=${params.id}`);
      if (!response.ok) {
        throw new Error("文章不存在");
      }
      const data = await response.json();
      const post = data.post || data.posts?.[0];
      if (!post) {
        throw new Error("文章不存在");
      }
      setPost({
        ...post,
        date: post.createdAt,
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
            <div className="markdown-content px-4 py-6 text-gray-800 dark:text-gray-200">
              {post.content && post.content.split('\n').map((line, index) => {
                // 检查是否是图片标记 ![alt](/uploads/xxx.png)
                if (line.startsWith('![') && line.includes('](/uploads/')) {
                  const altMatch = line.match(/!\[(.*?)\]/);
                  const srcMatch = line.match(/\((\/uploads\/.*?)\)/);
                  const alt = altMatch ? altMatch[1] : '';
                  const src = srcMatch ? srcMatch[1] : '';
                  
                  return (
                    <div key={index} className="my-6">
                      <img 
                        src={src} 
                        alt={alt} 
                        className="mx-auto max-w-full rounded-lg shadow-lg"
                        style={{ maxHeight: '600px' }}
                      />
                      {alt && (
                        <p className="mt-2 text-center text-sm text-gray-500">
                          {alt}
                        </p>
                      )}
                    </div>
                  );
                }
                
                // 检查是否是视频标记 <video controls src="/uploads/xxx.mp4"></video>
                if (line.includes('<video') && line.includes('src="/uploads/')) {
                  const srcMatch = line.match(/src="(\/uploads\/.*?)"/);
                  const src = srcMatch ? srcMatch[1] : '';
                  
                  return (
                    <div key={index} className="my-6">
                      <video 
                        controls 
                        src={src}
                        className="mx-auto max-w-full rounded-lg shadow-lg"
                        style={{ maxHeight: '600px' }}
                      />
                    </div>
                  );
                }
                
                // 普通文本段落
                if (line.trim()) {
                  return (
                    <p key={index} className="mb-4 whitespace-pre-wrap">
                      {line}
                    </p>
                  );
                }
                
                // 空行
                return <br key={index} />;
              })}
            </div>
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