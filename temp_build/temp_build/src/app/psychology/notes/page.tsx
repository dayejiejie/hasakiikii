"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface Note {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  tags: string[];
}

const notes: Note[] = [
  {
    id: 1,
    title: "认知心理学基础概念",
    excerpt: "认知心理学是研究人类高级心理过程的科学，包括注意、知觉、记忆、思维、语言等过程...",
    category: "基础理论",
    date: "2024-01-15",
    readTime: "10分钟",
    tags: ["认知心理学", "基础概念", "心理过程"]
  },
  {
    id: 2,
    title: "心理咨询技巧实践总结",
    excerpt: "在心理咨询过程中，倾听技巧和共情能力是最基本也是最重要的技能...",
    category: "实践技巧",
    date: "2024-01-10",
    readTime: "15分钟",
    tags: ["心理咨询", "技巧", "实践"]
  },
  {
    id: 3,
    title: "发展心理学研究方法",
    excerpt: "发展心理学研究采用横断研究和纵向研究两种主要方法，各有其优势和局限性...",
    category: "研究方法",
    date: "2024-01-05",
    readTime: "12分钟",
    tags: ["发展心理学", "研究方法", "方法论"]
  }
];

const categories = ["全部", "基础理论", "实践技巧", "研究方法", "案例分析"];

export default function NotesPage() {
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNotes = notes.filter(note => {
    const matchesCategory = selectedCategory === "全部" || note.category === selectedCategory;
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* 导航栏 */}
      <nav className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-md dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/psychology" className="text-2xl font-bold text-gray-800 dark:text-white">
              心理学空间
            </Link>
            <Link href="/psychology" className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white">
              返回
            </Link>
          </div>
        </div>
      </nav>

      {/* 主要内容区 */}
      <main className="container mx-auto px-4 pt-24">
        {/* 页面标题 */}
        <div className="mb-12 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 text-4xl font-bold text-gray-800 dark:text-white"
          >
            心理学学习笔记
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-600 dark:text-gray-300"
          >
            系统化的心理学知识分享与学习记录
          </motion.p>
        </div>

        {/* 搜索栏 */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="搜索笔记..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        {/* 分类标签 */}
        <div className="mb-8 flex flex-wrap gap-4">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* 笔记列表 */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <motion.article
              key={note.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5 }}
              className="overflow-hidden rounded-xl bg-white p-6 shadow-lg transition-shadow hover:shadow-xl dark:bg-gray-800"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {note.category}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {note.date}
                </span>
              </div>
              <h2 className="mb-3 text-xl font-bold text-gray-800 dark:text-white">
                {note.title}
              </h2>
              <p className="mb-4 text-gray-600 dark:text-gray-300">
                {note.excerpt}
              </p>
              <div className="mb-4 flex flex-wrap gap-2">
                {note.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {note.readTime}阅读
                </span>
                <Link
                  href={`/psychology/notes/${note.id}`}
                  className="text-blue-500 hover:text-blue-600 dark:text-blue-400"
                >
                  阅读更多 →
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      </main>

      {/* 页脚 */}
      <footer className="mt-20 bg-gray-50 py-8 dark:bg-gray-900">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          <p>© Hasakiikii. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
} 