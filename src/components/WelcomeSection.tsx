'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const WelcomeSection = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
      {/* 背景效果 */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 animate-pulse"></div>
      </div>

      {/* 返回按钮 */}
      <div className="absolute top-4 right-4 z-[100]">
        <Link 
          href="/"
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all duration-200 text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
      </div>

      {/* 主要内容 */}
      <div className={`relative flex items-center justify-center min-h-screen transition-opacity duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex flex-col items-center space-y-12 px-4 py-8 max-w-4xl mx-auto">
          {/* Logo */}
          <div className="animate-float">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 p-1 shadow-lg">
              <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
                <span className="text-4xl">🤖</span>
              </div>
            </div>
          </div>

          {/* 标题和副标题 */}
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold tracking-tight">
              <span className="inline-block animate-text-gradient bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-[200%_auto] bg-clip-text text-transparent">
                X-AI by Hasakiikii
              </span>
            </h1>
            <p className="text-xl text-white animate-fade-in max-w-2xl mx-auto">
              欢迎来到我个人AI集成网站！
            </p>
          </div>

          {/* AI 选择按钮 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
            {[
              { name: 'ChatGPT', path: '/ai2/chatgpt', color: 'from-green-500 to-green-600' },
              { name: 'Claude', path: '/ai2/claude', color: 'from-purple-500 to-purple-600' },
              { name: 'Gemini', path: '/ai2/gemini', color: 'from-blue-500 to-blue-600' }
            ].map((ai) => (
              <Link 
                key={ai.name} 
                href={ai.path}
                className={`group relative px-6 py-3 rounded-xl bg-gradient-to-r ${ai.color} 
                  text-white shadow-lg transition-all duration-300 hover:scale-105 
                  hover:shadow-xl text-center`}
              >
                <div className="relative font-semibold">
                  {ai.name}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeSection; 