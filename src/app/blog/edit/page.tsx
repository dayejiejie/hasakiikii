"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Editor } from '@tinymce/tinymce-react';

const categories = ["技术", "随笔", "生活", "项目"];

// 允许的文件类型
const ALLOWED_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  videos: ['video/mp4', 'video/webm', 'video/ogg']
};

const MAX_FILE_SIZE = {
  image: 5 * 1024 * 1024, // 5MB for images
  video: 100 * 1024 * 1024 // 100MB for videos
};

export default function EditPage() {
  const router = useRouter();
  const editorRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [author, setAuthor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [uploadedMediaIds, setUploadedMediaIds] = useState<string[]>([]);

  // 处理文件上传
  const handleFileUpload = async (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // 检查文件类型
      const isImage = ALLOWED_TYPES.images.includes(file.type);
      const isVideo = ALLOWED_TYPES.videos.includes(file.type);
      
      if (!isImage && !isVideo) {
        setError('不支持的文件类型');
        continue;
      }

      // 检查文件大小
      const maxSize = isVideo ? MAX_FILE_SIZE.video : MAX_FILE_SIZE.image;
      if (file.size > maxSize) {
        setError(`文件 ${file.name} 大小不能超过 ${maxSize / 1024 / 1024}MB`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);

        // 创建上传进度跟踪
        const uploadId = Math.random().toString(36).substring(7);
        setUploadProgress(prev => ({ ...prev, [uploadId]: 0 }));

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('上传失败');
        }

        const data = await response.json();
        
        // 保存媒体文件 ID
        if (data.mediaId) {
          setUploadedMediaIds(prev => [...prev, data.mediaId]);
        }
        
        // 根据文件类型插入不同的内容
        if (isImage) {
          editorRef.current?.insertContent(`<img src="${data.url}" alt="${file.name}" />`);
        } else if (isVideo) {
          editorRef.current?.insertContent(`
            <video width="100%" height="auto" controls>
              <source src="${data.url}" type="${file.type}">
              您的浏览器不支持视频标签
            </video>
          `);
        }

        // 清除进度
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[uploadId];
          return newProgress;
        });
      } catch (error) {
        console.error('上传文件时出错:', error);
        setError(`上传 ${file.name} 失败`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editorRef.current) return;

    setIsSubmitting(true);
    setError('');

    try {
      const content = editorRef.current.getContent();
      
      // 准备文章数据
      const postData = {
        title,
        content,
        category,
        author,
      };

      // 发送文章数据到服务器
      const response = await fetch('/api/blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        throw new Error('发布文章失败');
      }

      const data = await response.json();
      
      // 保存文章 ID 到 state 中，用于后续的文件上传
      const postId = data.post.id;
      
      // 如果有未关联的媒体文件，更新它们的关联
      if (uploadedMediaIds.length > 0) {
        await Promise.all(uploadedMediaIds.map(mediaId => 
          fetch(`/api/media/${mediaId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ postId }),
          })
        ));
      }

      // 重定向到博客列表页
      router.push('/blog');
    } catch (error) {
      console.error('提交文章时出错:', error);
      setError(error instanceof Error ? error.message : '发布文章时出错');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* 顶部导航栏 */}
      <nav className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-md shadow-sm dark:bg-gray-900/80 dark:shadow-gray-800/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/blog" 
              className="flex items-center space-x-2 text-xl font-bold text-gray-800 dark:text-white hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>返回博客</span>
            </Link>
            <button
              type="submit"
              form="editForm"
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
                  <span>发布中...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span>发布文章</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* 主要内容区 */}
      <main className="container mx-auto px-4 pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-4xl"
        >
          <form id="editForm" onSubmit={handleSubmit} className="space-y-8">
            {/* 标题输入 */}
            <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-2xl p-8 shadow-xl dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                文章标题
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-4 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-medium transition-shadow duration-200 hover:shadow-md"
                placeholder="请输入一个吸引人的标题..."
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
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
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
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
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

            {/* 文件上传 */}
            <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-2xl p-8 shadow-xl dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                上传图片/视频
              </label>
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif,.webp,.mp4,.webm,.ogg"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  multiple
                  className="w-full p-4 border-2 border-dashed rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-200">
                  <div className="bg-blue-500/90 text-white px-4 py-2 rounded-lg backdrop-blur-sm">
                    点击或拖放文件到此处
                  </div>
                </div>
              </div>
              {Object.entries(uploadProgress).map(([id, progress]) => (
                <div key={id} className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span>上传进度</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* 文章内容输入 */}
            <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-2xl p-8 shadow-xl dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                文章内容
              </label>
              <Editor
                onInit={(evt, editor) => editorRef.current = editor}
                apiKey="qkv4xgghv6b5pv7vdqj6ubjbndhncayrldss6a27unwje08o"
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
          </form>
        </motion.div>
      </main>
    </div>
  );
} 