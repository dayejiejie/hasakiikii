"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

export default function PsychologyPage() {
  const [activeSection, setActiveSection] = useState("timeline");

  const sections = [
    {
      id: "timeline",
      title: "时间线",
      subTitle: "我与心理·时间线",
      description: "记录心理学学习与成长的历程",
      icon: "/icons/timeline.svg",
      link: "/psychology/timeline"
    },
    {
      id: "notes",
      title: "学习笔记",
      subTitle: "心理学学习笔记",
      description: "系统化的心理学知识分享",
      icon: "/icons/notes.svg",
      link: "/psychology/notes"
    },
    {
      id: "tools",
      title: "辅助工具",
      subTitle: "心理学辅助工具",
      description: "实用的心理学测评与练习工具",
      icon: "/icons/tools.svg",
      link: "/psychology/tools"
    },
    {
      id: "community",
      title: "社区",
      subTitle: "心理学BBS社区",
      description: "心理学爱好者的交流平台",
      icon: "/icons/community.svg",
      link: "/psychology/community"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* 顶部导航栏 */}
      <nav className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-md dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-gray-800 dark:text-white">
              心理学空间
            </Link>
            <div className="flex items-center space-x-6">
              <Link href="/" className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white">
                首页
              </Link>
              {sections.map(section => (
                <Link 
                  key={section.id}
                  href={section.link} 
                  className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
                >
                  {section.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容区 */}
      <main className="container mx-auto px-4 pt-24">
        {/* 欢迎区域 */}
        <div className="mb-16 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 text-4xl font-bold text-gray-800 dark:text-white"
          >
            探索心灵的奥秘
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-600 dark:text-gray-300"
          >
            在这里，与你一起探索心理学的无限可能
          </motion.p>
        </div>

        {/* 四大板块展示 */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {sections.map((section, index) => (
            <Link href={section.link} key={section.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="group h-[280px] cursor-pointer overflow-hidden rounded-xl bg-white p-6 shadow-lg transition-shadow hover:shadow-xl dark:bg-gray-800"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <Image
                    src={section.icon}
                    alt={section.title}
                    width={24}
                    height={24}
                    className="text-blue-500 dark:text-blue-400"
                  />
                </div>
                <h3 className="mb-1 text-lg font-medium text-gray-600 dark:text-gray-400">
                  {section.title}
                </h3>
                <h2 className="mb-4 text-xl font-bold text-gray-800 group-hover:text-blue-500 dark:text-white">
                  {section.subTitle}
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  {section.description}
                </p>
                <div className="mt-4 flex items-center text-blue-500 group-hover:translate-x-2">
                  进入 →
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </main>

      {/* 页脚 */}
      <footer className="mt-20 bg-gray-50 py-8 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <h3 className="mb-4 text-lg font-bold text-gray-800 dark:text-white">关于</h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li><Link href="/psychology/about">关于我</Link></li>
                <li><Link href="/psychology/contact">联系我们</Link></li>
                <li><Link href="/psychology/faq">常见问题</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-bold text-gray-800 dark:text-white">法律</h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li><Link href="/psychology/privacy">隐私政策</Link></li>
                <li><Link href="/psychology/terms">使用条款</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-bold text-gray-800 dark:text-white">友情链接</h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li><a href="#" target="_blank" rel="noopener noreferrer">中国心理学会</a></li>
                <li><a href="#" target="_blank" rel="noopener noreferrer">心理学期刊网</a></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-bold text-gray-800 dark:text-white">关注我们</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
                  <span className="sr-only">微信</span>
                  {/* 微信图标 */}
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
                  <span className="sr-only">微博</span>
                  {/* 微博图标 */}
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-200 pt-8 text-center text-gray-600 dark:border-gray-700 dark:text-gray-400">
            <p>© Hasakiikii. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 