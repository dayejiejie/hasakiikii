"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { AdminAuth } from "@/components/AdminAuth/AdminAuth";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  category: string;
  excerpt?: string;
  author: string;
  createdAt: string;
}

const categories = ["全部", "技术", "随笔", "生活", "项目"];

// 从内容中提取第一个媒体文件
function extractFirstMedia(content: string) {
  // 尝试匹配第一个图片
  const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
  if (imgMatch) {
    return {
      type: 'image',
      url: imgMatch[1]
    };
  }

  // 尝试匹配第一个视频
  const videoMatch = content.match(/<video[^>]*>.*?<source[^>]+src="([^">]+)".*?>/s);
  if (videoMatch) {
    return {
      type: 'video',
      url: videoMatch[1]
    };
  }

  return null;
}

// 从内容中提取纯文本
function extractTextContent(content: string) {
  return content
    .replace(/<[^>]+>/g, '') // 移除所有HTML标签
    .replace(/&[^;]+;/g, '') // 移除HTML实体
    .trim()
    .slice(0, 200) + '...'; // 截取前200个字符
}

export default function BlogPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdminAuth, setShowAdminAuth] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch('/api/blog');
        const data = await response.json();
        
        if (response.ok && data.posts) {
          setPosts(data.posts);
        }
      } catch (error) {
        console.error('获取文章列表失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // 根据分类筛选文章
  const filteredPosts = selectedCategory === "全部"
    ? posts
    : posts.filter(post => post.category === selectedCategory);

  const handleWriteClick = () => {
    setShowAdminAuth(true);
  };

  const handleAuthSuccess = () => {
    setShowAdminAuth(false);
    router.push("/blog/edit");
  };

  const handleAuthCancel = () => {
    setShowAdminAuth(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 rounded-lg bg-gray-200 animate-pulse dark:bg-gray-700"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* 顶部导航栏 */}
      <nav className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-md dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-gray-800 dark:text-white">
              Hasakiikii
            </Link>
            <div className="flex items-center space-x-6">
              <Link href="/" className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white">
                首页
              </Link>
              <Link href="/blog" className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white">
                博客
              </Link>
              <button 
                onClick={handleWriteClick}
                className="rounded-full bg-blue-500 px-6 py-2 text-sm font-medium text-white hover:bg-blue-600"
              >
                写文章
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容区 */}
      <main className="container mx-auto px-4 pt-24">
        {/* 博客标题区 */}
        <div className="mb-12 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 text-4xl font-bold text-gray-800 dark:text-white"
          >
            探索 • 思考 • 分享
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-600 dark:text-gray-300"
          >
            记录技术与生活的点滴，分享成长的每一步
          </motion.p>
        </div>

        {/* 分类标签 */}
        <div className="mb-8 flex flex-nowrap justify-center gap-2 overflow-x-auto px-2 md:gap-4 md:px-0">
          {categories.map((category) => (
            <motion.button
              key={category}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap md:px-6 md:py-2 ${
                selectedCategory === category
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {category}
            </motion.button>
          ))}
        </div>

        {/* 文章列表 */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => {
            const media = extractFirstMedia(post.content);
            const textContent = extractTextContent(post.content);
            
            return (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                className="overflow-hidden rounded-lg bg-white shadow-lg transition-shadow hover:shadow-xl dark:bg-gray-800"
              >
                <Link href={`/blog/${post.id}`}>
                  {/* 媒体预览区域 */}
                  <div className="relative h-48 w-full bg-gray-200 dark:bg-gray-700">
                    {media ? (
                      media.type === 'image' ? (
                        <img
                          src={media.url}
                          alt={post.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <video
                          src={media.url}
                          className="h-full w-full object-cover"
                          preload="metadata"
                        />
                      )
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-500 dark:text-gray-400">
                        暂无预览
                      </div>
                    )}
                  </div>

                  {/* 文章信息 */}
                  <div className="p-6">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {post.category}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h2 className="mb-2 text-xl font-bold text-gray-800 dark:text-white">
                      {post.title}
                    </h2>
                    <p className="mb-4 text-gray-600 dark:text-gray-300">
                      {textContent}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>作者：{post.author}</span>
                      <span className="text-blue-500 transition-transform group-hover:translate-x-2 dark:text-blue-400">
                        阅读更多 →
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.article>
            );
          })}
        </div>
      </main>

      {/* 页脚 */}
      <footer className="mt-20 bg-gray-50 py-8 dark:bg-gray-900">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          <p>© Hasakiikii. All rights reserved.</p>
        </div>
      </footer>

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