/*
 * @Author: kasuie
 * @Date: 2024-05-20 17:15:33
 * @LastEditors: kasuie
 * @LastEditTime: 2024-07-05 16:56:27
 * @Description:
 */
'use client';

import { MainEffect } from '@/components/effect/MainEffect';
import { useConfig } from '@/hooks/useConfig';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { appConfig } = useConfig();
  const { bgConfig } = appConfig;

  return (
    <div className="min-h-screen w-full">
      <MainEffect 
        bgArr={[bgConfig.bg]}
        mbgArr={[bgConfig.mbg]}
        bgStyle={bgConfig.bgStyle}
        blur={bgConfig.blur}
        audio={bgConfig.audio}
        carousel={bgConfig.carousel}
        carouselGap={bgConfig.carouselGap}
        transitionTime={bgConfig.transitionTime}
        transitionStyle={bgConfig.transitionStyle}
        autoAnimate={bgConfig.autoAnimate}
      />
      <div className="relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-screen flex-col">
            {/* 主要内容区域 */}
            <main className="flex-1">
              <div className="mx-auto w-full max-w-4xl">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
