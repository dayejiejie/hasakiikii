"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

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
  const params = useParams();
  const router = useRouter();
  const [article, setArticle] = useState<ArticleForm>({
    title: "",
    category: categories[0],
    content: ""
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
      const post = await response.json();
      setArticle({
        title: post.title,
        category: post.category,
        content: post.content
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
    
    // 表单验证
    if (!article.title.trim()) {
      setError("请输入文章标题");
      return;
    }
    if (!article.content.trim()) {
      setError("请输入文章内容");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/blog`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: Number(params.id),
          ...article,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/blog/${params.id}`);
      } else {
        throw new Error(data.error || "更新失败");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新文章时出错");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="h-32 w-32 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* 顶部导航栏 */}
      <nav className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-md dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href={`/blog/${params.id}`} className="text-2xl font-bold text-gray-800 dark:text-white">
              返回文章
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
              {isSubmitting ? "保存中..." : "保存修改"}
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