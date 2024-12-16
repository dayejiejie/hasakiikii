"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

// 动态导入Markdown编辑器以避免SSR问题
const MDEditor = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default),
  { ssr: false }
);

interface ArticleForm {
  title: string;
  category: string;
  content: string;
}

const categories = ["技术", "随笔", "生活", "项目"];

export default function EditPage() {
  const router = useRouter();
  const [article, setArticle] = useState<ArticleForm>({
    title: "",
    category: categories[0],
    content: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);

  // 处理文件上传
  const handleFileUpload = async (file: File) => {
    try {
      console.log('开始上传文件:', file.name);
      const formData = new FormData();
      formData.append('file', file);
      // 使用临时ID，因为文章还未创建
      const tempId = 'temp-' + Date.now();
      formData.append('postId', tempId);
      
      console.log('发送请求到服务器...');
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      console.log('服务器响应状态:', response.status);
      const data = await response.json();
      console.log('服务器响应数据:', data);
      
      if (!response.ok) {
        throw new Error(data.error || data.details || '上传失败');
      }

      if (!data.success) {
        throw new Error(data.error || data.details || '上传失败');
      }

      // 根据文件类型插入不同的 Markdown 语法
      const insertText = data.type === 'image'
        ? `![${file.name}](${data.url})`
        : `<video controls src="${data.url}"></video>`;
      
      setArticle(prev => ({
        ...prev,
        content: prev.content + '\n' + insertText + '\n'
      }));

      console.log('文件上传成功');
    } catch (error) {
      console.error('文件上传失败:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : '文件上传失败，请重试';
      console.error('错误详情:', errorMessage);
      setError(errorMessage);
    }
  };

  // 处理文件拖放
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    files.forEach(handleFileUpload);
  }, []);

  // 处理粘贴
  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          await handleFileUpload(file);
        }
      }
    }
  }, []);

  // 添加粘贴事件监听
  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!article.title.trim() || !article.content.trim()) {
      setError("标题和内容不能为空");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(article),
      });

      if (!response.ok) {
        throw new Error('发布失败');
      }

      router.push('/blog');
    } catch (error) {
      console.error('发布文章失败:', error);
      setError('发布失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* 顶部导航栏 */}
      <nav className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-md dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/blog" className="text-2xl font-bold text-gray-800 dark:text-white">
              返回博客
            </Link>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`rounded-full px-6 py-2 text-sm font-medium text-white transition-colors ${
                isSubmitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              {isSubmitting ? "发布中..." : "发布文章"}
            </button>
          </div>
        </div>
      </nav>

      {/* 编辑区域 */}
      <main className="container mx-auto px-4 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800"
        >
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-500 dark:bg-red-900/50">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            {/* 标题输入 */}
            <input
              type="text"
              placeholder="文章标题"
              value={article.title}
              onChange={(e) => setArticle({ ...article, title: e.target.value })}
              className="mb-4 w-full rounded-lg border border-gray-200 bg-transparent p-4 text-xl font-bold text-gray-800 outline-none focus:border-blue-500 dark:border-gray-700 dark:text-white"
            />

            {/* 分类选择 */}
            <select
              value={article.category}
              onChange={(e) => setArticle({ ...article, category: e.target.value })}
              className="mb-4 rounded-lg border border-gray-200 bg-transparent p-2 text-gray-800 outline-none focus:border-blue-500 dark:border-gray-700 dark:text-white"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            {/* 文件上传区域 */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="mb-4 rounded-lg border-2 border-dashed border-gray-300 p-4 text-center dark:border-gray-700"
            >
              <p className="text-gray-600 dark:text-gray-400">
                拖放文件到此处，或者点击上传
              </p>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(file);
                  }
                }}
                className="mt-2"
              />
            </div>

            {/* Markdown编辑器 */}
            <div data-color-mode="light" className="dark:hidden">
              <MDEditor
                value={article.content}
                onChange={(value) => setArticle({ ...article, content: value || "" })}
                height={500}
                preview="edit"
              />
            </div>
            <div data-color-mode="dark" className="hidden dark:block">
              <MDEditor
                value={article.content}
                onChange={(value) => setArticle({ ...article, content: value || "" })}
                height={500}
                preview="edit"
              />
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
} 