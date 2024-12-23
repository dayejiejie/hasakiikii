"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import '@mdxeditor/editor/style.css';
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CreateLink,
  InsertImage
} from '@mdxeditor/editor';

const MDXEditorComponent = dynamic(
  () => import('@mdxeditor/editor').then((mod) => ({
    default: function MDXEditorWrapper(props: any) {
      return (
        <MDXEditor
          {...props}
          plugins={[
            headingsPlugin(),
            listsPlugin(),
            quotePlugin(),
            thematicBreakPlugin(),
            markdownShortcutPlugin(),
            toolbarPlugin({
              toolbarContents: () => (
                <>
                  <UndoRedo />
                  <BoldItalicUnderlineToggles />
                  <BlockTypeSelect />
                  <CreateLink />
                  <InsertImage />
                </>
              )
            })
          ]}
        />
      );
    }
  })),
  { ssr: false }
);

interface ArticleForm {
  title: string;
  category: string;
  content: string;
  author: string;
}

const categories = ["技术", "随笔", "生活", "项目"];

// 图片压缩函数
const compressImage = async (file: File, maxSizeMB = 1): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 如果图片大于 1200px，按比例缩小
        const MAX_WIDTH = 1200;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // 压缩图片
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('图片压缩失败'));
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          0.7 // 压缩质量，0.7 通常是一个好的平衡点
        );
      };
      img.onerror = () => {
        reject(new Error('图片加载失败'));
      };
    };
    reader.onerror = () => {
      reject(new Error('图片读取失败'));
    };
  });
};

export default function EditPage() {
  const router = useRouter();
  const [article, setArticle] = useState<ArticleForm>({
    title: "",
    category: categories[0],
    content: "",
    author: "Hasakiikii"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);

  // 处理文件上传
  const handleFileUpload = async (file: File) => {
    try {
      console.log('开始处理文件:', file.name);
      
      // 检查文件大小
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      if (file.size > MAX_SIZE) {
        throw new Error('文件大小不能超过 5MB');
      }

      let fileToUpload = file;
      if (file.type.startsWith('image/')) {
        console.log('开始压缩图片...');
        try {
          fileToUpload = await compressImage(file);
          console.log('图片压缩完成，压缩后大小:', fileToUpload.size);
        } catch (error) {
          console.warn('图片压缩失败，使用原图:', error);
        }
      }

      console.log('开始上传文件...');
      const formData = new FormData();
      formData.append('file', fileToUpload);
      
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
      const insertText = fileToUpload.type.startsWith('image/')
        ? `![${fileToUpload.name}](${data.file.url})`
        : `<video controls src="${data.file.url}"></video>`;
      
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
    console.log('开始提交文章，当前文章内容:', {
      title: article.title,
      category: article.category,
      contentLength: article.content.length,
      content: article.content.substring(0, 100) + '...' // 只显示前100个字符
    });

    if (!article.title.trim() || !article.content.trim()) {
      setError("标题和内容不能为空");
      return;
    }

    setIsSubmitting(true);
    try {
      const postData = {
        ...article,
        readTime: `${Math.ceil(article.content.length / 500)} 分钟`,
        excerpt: article.content
          .replace(/<[^>]+>/g, '') // 移除HTML标签
          .replace(/!\[.*?\]\(.*?\)/g, '') // 移除图片标记
          .replace(/\[.*?\]\(.*?\)/g, '') // 移除链接标记
          .replace(/#{1,6}\s+/g, '') // 移除标题标记
          .replace(/\*\*|__/g, '') // 移除加粗标记
          .replace(/\*|_/g, '') // 移除斜体标记
          .replace(/`{1,3}[\s\S]*?`{1,3}/g, '') // 移除代码块
          .replace(/\n+/g, ' ') // 将多个换行替换为单个空格
          .trim()
          .slice(0, 100) + "..."
      };
      
      console.log('准备发送的文章数据:', {
        title: postData.title,
        category: postData.category,
        contentLength: postData.content.length,
        excerpt: postData.excerpt,
        readTime: postData.readTime,
        content: postData.content.substring(0, 100) + '...' // 只显示前100个字符
      });
      
      const response = await fetch('/api/blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      console.log('服务器响应状态:', response.status);
      const data = await response.json();
      console.log('服务器响应数据:', {
        success: data.success,
        error: data.error,
        post: data.post ? {
          id: data.post.id,
          title: data.post.title,
          contentLength: data.post.content.length,
          excerpt: data.post.excerpt
        } : null
      });

      if (!response.ok) {
        throw new Error(data.error || '发布失败');
      }

      if (!data.success) {
        throw new Error(data.error || '发布失败');
      }

      console.log('文章发布成功，准备跳转到博客列表页');
      router.push('/blog');
    } catch (error) {
      console.error('发布文章失败:', error);
      const errorMessage = error instanceof Error ? error.message : '发布失败，请重试';
      console.error('错误详情:', errorMessage);
      setError(errorMessage);
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

            {/* 文本编辑器 */}
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <textarea
                value={article.content}
                onChange={(e) => {
                  const value = e.target.value;
                  console.log('编辑器内容更新:', value);
                  setArticle({ ...article, content: value });
                }}
                className="min-h-[500px] w-full rounded-lg border border-gray-200 p-4 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                placeholder="在这里输入文章内容..."
              />
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
} 