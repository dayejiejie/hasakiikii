/*
 * @Author: kasuie
 * @Date: 2024-05-20 17:15:33
 * @LastEditors: kasuie
 * @LastEditTime: 2024-07-05 16:56:27
 * @Description:
 */
import Link from 'next/link';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-screen flex-col">
          {/* 响应式导航栏 */}
          <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="flex h-14 items-center justify-between py-4 md:h-16">
              <div className="flex items-center space-x-4">
                <Link href="/" className="flex items-center space-x-2">
                  <span className="font-bold text-xl md:text-2xl">Remio</span>
                </Link>
              </div>
            </div>
          </header>

          {/* 主要内容区域 */}
          <main className="flex-1 py-6 md:py-8">
            <div className="mx-auto w-full max-w-4xl">
              {children}
            </div>
          </main>

          {/* 响应式页脚 */}
          <footer className="py-6 md:py-8">
            <div className="container mx-auto px-4">
              <div className="text-center text-sm text-gray-500">
                © {new Date().getFullYear()} Remio. All rights reserved.
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
