/*
 * @Author: kasuie
 * @Date: 2024-05-26 16:56:52
 * @LastEditors: kasuie
 * @LastEditTime: 2024-10-22 22:03:02
 * @Description:
 */
"use client";
import { BgConfig } from "@/config/config";
import { isClientSide, aSakura, clsx } from "@kasuie/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { variants, showMotion } from "@/lib/motion";
import { Controller } from "../controller/Controller";

export function MainEffect({
  bgArr,
  mbgArr,
  bgStyle,
  blur,
  audio,
  carousel = false,
  carouselGap = 6,
  transitionTime,
  transitionStyle = "default",
  autoAnimate,
  theme,
  motions = {},
}: BgConfig & {
  bgArr: string[];
  mbgArr: string[];
  theme?: string;
  motions?: object;
}) {
  const [currentBg, setCurrentBg] = useState<string>(bgArr[0]);
  const [variant, setVariant] = useState<Object>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [aPlaying, setAPlaying] = useState(false);
  const [hasMedia, setHasMedia] = useState(false);

  useEffect(() => {
    if (isClientSide && bgStyle && document) {
      if (!document.querySelector("#remio_sakura")) {
        aSakura(bgStyle);
      }
    }
    if (audioRef.current) {
      audioRef.current.play();
      setAPlaying(true);
    }
  });

  useEffect(() => {
    if (audio) {
      setHasMedia(true);
    }
  }, [audio]);

  useEffect(() => {
    if (!autoAnimate) {
      transitionStyle
        ? setVariant(variants.default)
        : setVariant(variants[transitionStyle]);
    }
  }, [autoAnimate, transitionStyle]);

  // 切换播放/暂停状态
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (aPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setAPlaying(!aPlaying);
    }
  };

  const className = clsx(
    "fixed brightness-50 dark:brightness-[.25] h-full w-full top-0 left-0 bg-cover bg-fixed bg-center bg-no-repeat",
    {
      "blur-none": blur == "none",
      "blur-sm": blur == "sm",
      "blur-md": blur == "md",
      "blur-lg": blur == "lg",
    }
  );

  const renderAudio = (url: string) => {
    return <audio ref={audioRef} src={url} />;
  };

  const renderBg = (url: string, isMbg: boolean, key: number) => {
    const classNames = clsx(className, {
      "md:hidden": isMbg,
      "[@media(max-width:768px)]:hidden": !isMbg,
    });

    if (!url) return null;

    return (
      <motion.div
        key={`${isMbg ? 'mobile' : 'desktop'}-${key}-${url}`}
        className={classNames}
        style={{
          backgroundImage: `url(${url})`,
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          zIndex: -1
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: 0.5,
          ease: "easeInOut",
        }}
      ></motion.div>
    );
  };

  // 监听自定义事件来更新背景
  useEffect(() => {
    const handleBgChange = (e: CustomEvent) => {
      setCurrentBg(e.detail.bg);
    };

    window.addEventListener('changeBg' as any, handleBgChange as any);

    return () => {
      window.removeEventListener('changeBg' as any, handleBgChange as any);
    };
  }, []);

  return (
    <section className="z-0">
      <AnimatePresence>
        {renderBg(currentBg, false, 0)}
        {mbgArr && renderBg(mbgArr[0], true, 0)}
        {audio && renderAudio(audio)}
      </AnimatePresence>
      <Controller
        theme={theme}
        hasMedia={hasMedia}
        motions={motions}
        handleMuteUnmute={audio ? togglePlayPause : undefined}
      />
    </section>
  );
}
