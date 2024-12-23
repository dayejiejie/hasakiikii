"use client";

import Link from "next/link";

export default function AILayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="absolute top-4 right-4 z-[100]">
        <Link 
          href="/"
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/80 hover:bg-white shadow-lg backdrop-blur-md transition-all duration-200 text-gray-600 hover:text-gray-900 dark:bg-gray-800/80 dark:hover:bg-gray-800 dark:text-gray-300 dark:hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
      </div>
      {children}
    </div>
  );
} 