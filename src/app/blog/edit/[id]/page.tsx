"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Editor } from '@tinymce/tinymce-react';

const categories = ["技术", "随笔", "生活", "项目"];

interface ArticleForm {
  title: string;
  category: string;
  content: string;
  author: string;
}

export default function EditPage() {
  const params = useParams();
  const router = useRouter();
  const editorRef = useRef<any>(null);
  const [article, setArticle] = useState<ArticleForm>({
    title: "",
    category: categories[0],
    content: "",
    author: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchArticle();
  }, []);

  const fetchArticle = async () => {
    try {
      const response = await fetch(`/api/blog?id=${params.id}`);
      if (!response.ok) {
        throw new Error("文章不存在");
      }
      const data = await response.json();
      const post = data.post;
      if (!post) {
        throw new Error("文章不存在");
      }
      
      setArticle({
        title: post.title,
        category: post.category,
        content: post.content,
        author: post.author
      });
    } catch (error) {
      console.error("获取文章失败:", error);
      setError("获取文章失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editorRef.current) return;
    
    if (!article.title.trim()) {
      setError("请输入文章标题");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const content = editorRef.current.getContent();
      const response = await fetch(`/api/blog`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: params.id,
          ...article,
          content
        }),
      });

      const data = await response.json();
      console.log('更新响应:', data);

      if (!response.ok) {
        throw new Error(data.error || "更新失败");
      }

      if (!data.success) {
        throw new Error(data.error || "更新失败");
      }

      router.push(`/blog/${params.id}`);
    } catch (err) {
      console.error('更新文章失败:', err);
      setError(err instanceof Error ? err.message : "更新文章时出错");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="h-32 w-32 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* 顶部导航栏 */}
      <nav className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-md shadow-sm dark:bg-gray-900/80 dark:shadow-gray-800/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href={`/blog/${params.id}`} 
              className="flex items-center space-x-2 text-xl font-bold text-gray-800 dark:text-white hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>返回文章</span>
            </Link>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`rounded-full px-8 py-2.5 text-sm font-medium text-white transition-all duration-200 transform hover:scale-105 ${
                isSubmitting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>保存中...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  <span>保存修改</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* 编辑区域 */}
      <main className="container mx-auto px-4 pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-4xl"
        >
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 dark:bg-red-900/50 text-red-500 p-6 rounded-xl shadow-lg border border-red-100 dark:border-red-800"
              >
                <div className="flex items-center space-x-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              </motion.div>
            )}

            {/* 标题输入 */}
            <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-2xl p-8 shadow-xl dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                文章标题
              </label>
              <input
                type="text"
                value={article.title}
                onChange={(e) => setArticle({ ...article, title: e.target.value })}
                className="w-full p-4 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-medium transition-shadow duration-200 hover:shadow-md"
                placeholder="请输入文章标题..."
                required
              />
            </div>

            {/* 分类和作者 */}
            <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-2xl p-8 shadow-xl dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700">
              <div className="flex flex-wrap gap-8">
                {/* 分类选择 */}
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    文章分类
                  </label>
                  <div className="relative">
                    <select
                      value={article.category}
                      onChange={(e) => setArticle({ ...article, category: e.target.value })}
                      className="appearance-none w-full p-4 pr-10 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow duration-200 hover:shadow-md cursor-pointer"
                      required
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat} className="py-2">
                          {cat}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500 dark:text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* 作者输入 */}
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    作者
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={article.author}
                      onChange={(e) => setArticle({ ...article, author: e.target.value })}
                      className="w-full p-4 pl-11 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow duration-200 hover:shadow-md"
                      placeholder="请输入作者名..."
                      required
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center px-3 pointer-events-none text-gray-400 dark:text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 文章内容编辑器 */}
            <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-2xl p-8 shadow-xl dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                文章内容
              </label>
              <Editor
                onInit={(evt, editor) => editorRef.current = editor}
                apiKey="qkv4xgghv6b5pv7vdqj6ubjbndhncayrldss6a27unwje08o"
                initialValue={article.content}
                init={{
                  height: 600,
                  menubar: false,
                  plugins: [
                    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                    'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                  ],
                  toolbar: 'undo redo | blocks | ' +
                    'bold italic forecolor | alignleft aligncenter ' +
                    'alignright alignjustify | bullist numlist outdent indent | ' +
                    'removeformat | help',
                  content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:16px; line-height:1.6; }',
                  skin: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oxide-dark' : 'oxide',
                  content_css: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'default',
                  min_height: 500,
                  resize: false,
                  branding: false,
                  statusbar: false,
                }}
              />
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
} 