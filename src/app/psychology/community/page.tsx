"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

interface Post {
  id: number;
  title: string;
  content: string;
  author: {
    name: string;
    avatar: string;
  };
  category: string;
  tags: string[];
  date: string;
  likes: number;
  comments: number;
}

interface Resource {
  id: number;
  title: string;
  description: string;
  type: "book" | "paper" | "course" | "tool";
  link: string;
  author: string;
  downloads: number;
  rating: number;
}

const posts: Post[] = [
  {
    id: 1,
    title: "如何提高专注力和学习效率？",
    content: "最近在准备考试，发现自己很容易分心，想请教大家有什么好的方法提高专注力...",
    author: {
      name: "学习达人",
      avatar: "/avatars/user1.jpg"
    },
    category: "学习讨论",
    tags: ["专注力", "学习方法", "时间管理"],
    date: "2024-01-20",
    likes: 25,
    comments: 12
  },
  {
    id: 2,
    title: "分享一个有效的压力管理技巧",
    content: "作为一名心理咨询师，我想分享一个在实践中非常有效的压力管理方法...",
    author: {
      name: "心理咨询师小王",
      avatar: "/avatars/user2.jpg"
    },
    category: "经验分享",
    tags: ["压力管理", "心理健康", "实用技巧"],
    date: "2024-01-19",
    likes: 45,
    comments: 18
  }
];

const resources: Resource[] = [
  {
    id: 1,
    title: "认知心理学导论",
    description: "一本非常适合入门的认知心理学教材，包含大量案例和练习",
    type: "book",
    link: "#",
    author: "约翰·安德森",
    downloads: 1200,
    rating: 4.8
  },
  {
    id: 2,
    title: "正念冥想与压力管理",
    description: "系统介绍正念冥想的理论基础和实践方法",
    type: "course",
    link: "#",
    author: "正念研究中心",
    downloads: 850,
    rating: 4.6
  }
];

const categories = ["全部", "学习讨论", "经验分享", "求助互助", "资源分享"];
const resourceTypes = ["全部", "图书", "论文", "课程", "工具"];

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<"posts" | "resources">("posts");
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [selectedResourceType, setSelectedResourceType] = useState("全部");

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
            心理学社区
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-600 dark:text-gray-300"
          >
            分享知识，交流经验，共同成长
          </motion.p>
        </div>

        {/* 主选项卡 */}
        <div className="mb-8 flex justify-center space-x-4">
          <button
            onClick={() => setActiveTab("posts")}
            className={`rounded-full px-6 py-2 text-sm font-medium transition-colors ${
              activeTab === "posts"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            讨论区
          </button>
          <button
            onClick={() => setActiveTab("resources")}
            className={`rounded-full px-6 py-2 text-sm font-medium transition-colors ${
              activeTab === "resources"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            资源分享
          </button>
        </div>

        {activeTab === "posts" ? (
          <>
            {/* 分类标签 */}
            <div className="mb-8 flex flex-wrap justify-center gap-4">
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

            {/* 发帖按钮 */}
            <div className="mb-8 text-center">
              <Link
                href="/psychology/community/new-post"
                className="inline-block rounded-full bg-blue-500 px-6 py-2 text-sm font-medium text-white hover:bg-blue-600"
              >
                发布新帖子
              </Link>
            </div>

            {/* 帖子列表 */}
            <div className="space-y-6">
              {posts.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="overflow-hidden rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800"
                >
                  <div className="mb-4 flex items-center space-x-4">
                    <Image
                      src={post.author.avatar}
                      alt={post.author.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-white">{post.author.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{post.date}</p>
                    </div>
                  </div>
                  <h2 className="mb-2 text-xl font-bold text-gray-800 dark:text-white">
                    {post.title}
                  </h2>
                  <p className="mb-4 text-gray-600 dark:text-gray-300">{post.content}</p>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex space-x-4">
                      <span>👍 {post.likes}</span>
                      <span>💬 {post.comments}</span>
                    </div>
                    <Link
                      href={`/psychology/community/posts/${post.id}`}
                      className="text-blue-500 hover:text-blue-600 dark:text-blue-400"
                    >
                      查看详情 →
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* 资源类型筛选 */}
            <div className="mb-8 flex flex-wrap justify-center gap-4">
              {resourceTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedResourceType(type)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    selectedResourceType === type
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* 资源列表 */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {resources.map((resource) => (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="overflow-hidden rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800"
                >
                  <div className="mb-4">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {resource.type}
                    </span>
                  </div>
                  <h2 className="mb-2 text-xl font-bold text-gray-800 dark:text-white">
                    {resource.title}
                  </h2>
                  <p className="mb-4 text-gray-600 dark:text-gray-300">
                    {resource.description}
                  </p>
                  <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                    <p>作者：{resource.author}</p>
                    <p>下载次数：{resource.downloads}</p>
                    <p>评分：{'⭐'.repeat(Math.round(resource.rating))}</p>
                  </div>
                  <a
                    href={resource.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-full bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                  >
                    下载资源
                  </a>
                </motion.div>
              ))}
            </div>
          </>
        )}
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