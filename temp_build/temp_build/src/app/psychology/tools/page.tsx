"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

interface Tool {
  id: number;
  title: string;
  description: string;
  category: "assessment" | "practice" | "research";
  icon: string;
  link: string;
}

const tools: Tool[] = [
  {
    id: 1,
    title: "心理健康自评量表",
    description: "全面的心理健康状况评估工具，包含情绪、压力、人际关系等多个维度",
    category: "assessment",
    icon: "/icons/assessment.svg",
    link: "/psychology/tools/assessment"
  },
  {
    id: 2,
    title: "正念冥想指导",
    description: "专业的正念冥想音频指导，帮助你缓解压力、提升专注力",
    category: "practice",
    icon: "/icons/meditation.svg",
    link: "/psychology/tools/meditation"
  },
  {
    id: 3,
    title: "情绪日记模板",
    description: "结构化的情绪记录工具，帮助你更好地理解和管理自己的情绪",
    category: "practice",
    icon: "/icons/diary.svg",
    link: "/psychology/tools/diary"
  },
  {
    id: 4,
    title: "认知行为训练",
    description: "基于认知行为疗法的在线练习，帮助你改善消极思维模式",
    category: "practice",
    icon: "/icons/cbt.svg",
    link: "/psychology/tools/cbt"
  },
  {
    id: 5,
    title: "研究数据分析工具",
    description: "心理学研究数据分析工具集，支持常用统计方法和可视化",
    category: "research",
    icon: "/icons/analysis.svg",
    link: "/psychology/tools/analysis"
  },
  {
    id: 6,
    title: "问卷设计助手",
    description: "专业的心理学问卷设计工具，包含常用量表和题目推荐",
    category: "research",
    icon: "/icons/survey.svg",
    link: "/psychology/tools/survey"
  }
];

const categories = {
  all: "全部工具",
  assessment: "测评工具",
  practice: "练习工具",
  research: "研究工具"
};

export default function ToolsPage() {
  const [selectedCategory, setSelectedCategory] = useState<"all" | "assessment" | "practice" | "research">("all");

  const filteredTools = selectedCategory === "all"
    ? tools
    : tools.filter(tool => tool.category === selectedCategory);

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
            心理学辅助工具
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-600 dark:text-gray-300"
          >
            专业的心理学工具，助力你的学习与成长
          </motion.p>
        </div>

        {/* 分类标签 */}
        <div className="mb-12 flex flex-wrap justify-center gap-4">
          {(Object.entries(categories) as [keyof typeof categories, string][]).map(([key, label]) => (
            <motion.button
              key={key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(key as any)}
              className={`rounded-full px-6 py-2 text-sm font-medium transition-colors ${
                selectedCategory === key
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {label}
            </motion.button>
          ))}
        </div>

        {/* 工具列表 */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredTools.map((tool) => (
            <Link href={tool.link} key={tool.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                className="group cursor-pointer overflow-hidden rounded-xl bg-white p-6 shadow-lg transition-shadow hover:shadow-xl dark:bg-gray-800"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <Image
                    src={tool.icon}
                    alt={tool.title}
                    width={24}
                    height={24}
                    className="text-blue-500 dark:text-blue-400"
                  />
                </div>
                <h2 className="mb-2 text-xl font-bold text-gray-800 group-hover:text-blue-500 dark:text-white">
                  {tool.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  {tool.description}
                </p>
                <div className="mt-4 flex items-center text-blue-500 group-hover:translate-x-2">
                  开始使用 →
                </div>
              </motion.div>
            </Link>
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