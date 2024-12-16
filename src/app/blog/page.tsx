"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminAuth } from "@/components/AdminAuth/AdminAuth";

interface BlogPost {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  date: string;
  category: string;
  readTime: string;
}

const categories = ["全部", "技术", "随笔", "生活", "项目"];

export default function BlogPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdminAuth, setShowAdminAuth] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/blog");
      const data = await response.json();
      if (!data || !data.posts) {
        console.error("获取文章列表失败: 返回数据格式错误", data);
        setPosts([]);
        return;
      }
      // 为每篇文章生成摘要
      const postsWithExcerpt = data.posts.map((post: BlogPost) => ({
        ...post,
        excerpt: post.content.slice(0, 100) + "..."
      }));
      setPosts(postsWithExcerpt);
    } catch (error) {
      console.error("获取文章列表失败:", error);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

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
        <div className="mb-8 flex flex-wrap justify-center gap-4">
          {categories.map((category) => (
            <motion.button
              key={category}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full px-6 py-2 text-sm font-medium transition-colors ${
                selectedCategory === category
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {category}
            </motion.button>
          ))}
        </div>

        {/* 博客文章列表 */}
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {isLoading ? (
            // 加载状态
            Array(6).fill(0).map((_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-xl bg-gray-200 p-6 dark:bg-gray-700"
                style={{ height: "250px" }}
              />
            ))
          ) : filteredPosts.length === 0 ? (
            // 无文章状态
            <div className="col-span-full text-center text-gray-500 dark:text-gray-400">
              暂无文章
            </div>
          ) : (
            // 文章列表
            filteredPosts.map((post) => (
              <Link href={`/blog/${post.id}`} key={post.id}>
                <motion.article
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -5 }}
                  className="group h-full cursor-pointer overflow-hidden rounded-xl bg-white p-6 shadow-lg transition-shadow hover:shadow-xl dark:bg-gray-800"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {post.category}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(post.date).toLocaleDateString()}
                    </span>
                  </div>
                  <h2 className="mb-3 text-xl font-bold text-gray-800 group-hover:text-blue-500 dark:text-white">
                    {post.title}
                  </h2>
                  <p className="mb-4 text-gray-600 dark:text-gray-300">{post.excerpt}</p>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{post.readTime} 阅读</span>
                    <span className="text-blue-500 transition-transform group-hover:translate-x-2 dark:text-blue-400">
                      阅读更多 →
                    </span>
                  </div>
                </motion.article>
              </Link>
            ))
          )}
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