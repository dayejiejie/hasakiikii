"use client";

import dynamic from "next/dynamic";

const WelcomeSection = dynamic(
  () => import("@/components/WelcomeSection"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    ),
  }
);

export default function AI2Page() {
  return (
    <main className="min-h-screen">
      <WelcomeSection />
    </main>
  );
} 