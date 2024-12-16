"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface TimelineEvent {
  date: string;
  title: string;
  description: string;
  category: "study" | "practice" | "certification" | "research";
  image?: string;
}

const timelineEvents: TimelineEvent[] = [
  {
    date: "2020-09",
    title: "开始心理学本科学习",
    description: "在XX大学心理学系开始本科学习之旅，接触基础心理学理论与实验方法。",
    category: "study",
    image: "/images/psychology/university.jpg"
  },
  {
    date: "2021-06",
    title: "首次心理咨询实践",
    description: "在校心理咨询中心进行首次实践，学习基本咨询技巧与伦理规范。",
    category: "practice",
    image: "/images/psychology/counseling.jpg"
  },
  {
    date: "2022-03",
    title: "获得心理咨询师证书",
    description: "通过国家心理咨询师资格考试，获得三级心理咨询师证书。",
    category: "certification",
    image: "/images/psychology/certificate.jpg"
  },
  {
    date: "2023-01",
    title: "发表首篇研究论文",
    description: "在《心理学报》发表首篇研究论文，探讨青少年心理健康问题。",
    category: "research",
    image: "/images/psychology/research.jpg"
  }
];

const categoryColors = {
  study: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  practice: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  certification: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  research: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
};

export default function TimelinePage() {
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
        <div className="mb-16 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 text-4xl font-bold text-gray-800 dark:text-white"
          >
            我与心理·时间线
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-600 dark:text-gray-300"
          >
            记录我的心理学学习与成长历程
          </motion.p>
        </div>

        {/* 时间线 */}
        <div className="relative">
          {/* 中轴线 */}
          <div className="absolute left-1/2 h-full w-0.5 -translate-x-1/2 bg-gray-200 dark:bg-gray-700" />

          {/* 时间线事件 */}
          {timelineEvents.map((event, index) => (
            <motion.div
              key={event.date}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.2 }}
              className={`mb-12 flex ${index % 2 === 0 ? "flex-row" : "flex-row-reverse"}`}
            >
              <div className="w-1/2" />
              <div className="relative w-1/2 px-8">
                {/* 时间点 */}
                <div className="absolute left-0 top-0 flex h-8 w-8 -translate-x-1/2 transform items-center justify-center rounded-full bg-white shadow-lg dark:bg-gray-800">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                </div>

                {/* 内容卡片 */}
                <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
                  <span className={`mb-2 inline-block rounded-full px-3 py-1 text-sm font-medium ${categoryColors[event.category]}`}>
                    {event.category === "study" ? "学习" :
                     event.category === "practice" ? "实践" :
                     event.category === "certification" ? "认证" : "研究"}
                  </span>
                  <time className="mb-2 block text-sm text-gray-500 dark:text-gray-400">{event.date}</time>
                  <h3 className="mb-2 text-xl font-bold text-gray-800 dark:text-white">{event.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{event.description}</p>
                  {event.image && (
                    <img 
                      src={event.image} 
                      alt={event.title}
                      className="mt-4 h-48 w-full rounded-lg object-cover"
                    />
                  )}
                </div>
              </div>
            </motion.div>
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