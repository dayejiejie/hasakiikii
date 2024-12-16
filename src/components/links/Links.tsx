/*
 * @Author: kasuie
 * @Date: 2024-05-22 19:32:38
 * @LastEditors: kasuie
 * @LastEditTime: 2024-06-24 21:51:34
 * @Description:
 */
"use client";
import { Image } from "@/components/ui/image/Image";
import useModal from "@/components/ui/modal/useModal";
import { Modal } from "@/components/ui/modal/Modal";
import Link from "next/link";
import { ExternalLink, DotsHorizontal } from "@kasuie/icon";
import { clsx } from "@kasuie/utils";
import { Site, SitesConfig } from "@/config/config";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { CSSProperties, useState, useEffect } from "react";
import { message } from "@/components/ui/message/message";

const FlipCard = dynamic(
  async () => (await import("../cards/FlipCard")).FlipCard
);

interface LinksProps {
  primaryColor?: string;
  cardOpacity?: number;
  staticSites: Site[];
  modalSites: Site[];
  sitesConfig?: SitesConfig;
  motions?: object;
  warpClass?: string;
}

export function Links({
  staticSites,
  modalSites,
  primaryColor,
  cardOpacity,
  sitesConfig = {
    hoverScale: true,
    hoverBlur: true,
    modal: true,
  },
  motions = {},
  warpClass,
}: LinksProps) {
  const { isVisible, openModal, closeModal } = useModal();
  const [currentBg, setCurrentBg] = useState<string>("/prev.png");

  const handleMouseEnter = (hoverBgKey: string) => {
    if (!hoverBgKey) return;
    
    const bgMap: { [key: string]: string } = {
      "blog": "/bg1.jpg",
      "psychology": "/bg2.png",
      "ai": "/bg3.png",
      "more": "/bg4.jpg"
    };

    // 发送自定义事件来更新背景
    const event = new CustomEvent('changeBg', { 
      detail: { bg: bgMap[hoverBgKey] || "/prev.png" }
    });
    window.dispatchEvent(event);
  };

  const handleMouseLeave = () => {
    // 发送自定义事件来恢复默认背景
    const event = new CustomEvent('changeBg', { 
      detail: { bg: "/prev.png" }
    });
    window.dispatchEvent(event);
  };

  const handleClick = (url?: string) => {
    if (url === "#") {
      message.info("更多功能正在开发中，敬请期待！");
      return;
    }
    if (!url && sitesConfig?.modal) {
      openModal();
    }
  };

  const itemContent = (item: Site, outer: boolean = true) => {
    const style: CSSProperties = outer
      ? {
          backgroundColor: `rgba(var(--mio-main), ${cardOpacity})`,
        }
      : {};

    if (sitesConfig.cardStyle == "flip") {
      return (
        <FlipCard
          data={item}
          outer={outer}
          style={style}
          direction={sitesConfig?.direction}
          hoverFlip={sitesConfig?.hoverFlip}
        />
      );
    }

    const className = clsx(
      "group/main relative shadow-mio-link z-[1] flex h-[100px] sm:h-[90px] flex-row flex-nowrap items-center gap-[8px] sm:gap-[10px] overflow-hidden rounded-2xl bg-black/10 p-[12px_15px] sm:p-[10px_15px] duration-500 hover:z-10 hover:border-transparent hover:!blur-none",
      {
        "hover:!scale-102 sm:hover:!scale-110 backdrop-blur-[7px]": outer,
        "group-hover/links:scale-90": sitesConfig.hoverScale,
        "group-hover/links:blur-[1px]": sitesConfig.hoverBlur,
      }
    );

    return (
      <div style={style} className={className}>
        {item.icon && (
          <div className="flex-shrink-0 p-[5px]">
            <Image
              alt={item.title}
              src={item.icon}
              width={42}
              height={42}
              className="w-[42px] h-[42px] rounded-full"
              style={{
                borderRadius: "50%",
              }}
            ></Image>
          </div>
        )}
        <div className="flex-1 min-w-0 p-[5px]">
          {item.title && <p className="text-white text-base sm:text-base font-medium truncate">{item.title}</p>}
          {item.desc && (
            <p className="pt-[4px] text-sm text-white/70 truncate leading-tight">{item.desc}</p>
          )}
        </div>
        <span className="flex-shrink-0 text-white/70 ml-2">
          {item?.url ? (
            <ExternalLink size={16} className="w-4 h-4" />
          ) : (
            <DotsHorizontal size={16} className="w-4 h-4" />
          )}
        </span>
      </div>
    );
  };

  const linkItem = (item: Site, key: number, outer: boolean = true) => {
    return (
      <div
        key={key}
        title={item.title}
        className={clsx(
          "flex cursor-pointer flex-col justify-center w-full",
          {
            "sm:w-[calc(25%-12px)]": outer,
            "basis-full": !outer,
          }
        )}
        onMouseEnter={() => handleMouseEnter(item.hoverBgKey || "")}
        onMouseLeave={handleMouseLeave}
      >
        {item?.url ? (
          <div 
            onClick={() => handleClick(item.url)} 
            className="block w-full"
          >
            {item.url.startsWith('http') || item.url === '#' ? (
              <div className="block w-full">
                {itemContent(item, outer)}
              </div>
            ) : (
              <Link href={item.url} className="block w-full">
                {itemContent(item, outer)}
              </Link>
            )}
          </div>
        ) : (
          <div
            onClick={() => handleClick()}
            className="block w-full"
          >
            {itemContent(item)}
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    // 添加CSS变量到根元素
    const root = document.documentElement;
    root.style.setProperty('--bg-image', 'url(/prev.png)');
  }, []);

  return (
    <motion.div
      {...motions}
      className={clsx(
        "group/links z-[100] mt-3 flex flex-col sm:flex-row sm:flex-wrap sm:justify-between w-full gap-3 sm:gap-4 md:mt-8",
        warpClass
      )}
    >
      {staticSites.map((v, index) => linkItem(v, index))}
      {sitesConfig?.modal && modalSites?.length ? (
        <Modal
          className="w-[650px]"
          visible={isVisible}
          title={sitesConfig?.modalTitle}
          closeModal={closeModal}
        >
          {sitesConfig?.modalTips && (
            <div className="relative pb-2 indent-5 text-sm text-white/90 before:absolute before:left-[7px] before:top-2 before:h-1 before:w-1 before:rounded-full before:bg-[#229fff] before:content-[''] after:absolute after:left-[5px] after:top-[6px] after:h-2 after:w-2 after:rounded-full after:border after:border-[#229fff]">
              {sitesConfig.modalTips}
            </div>
          )}
          <div className="flex flex-wrap justify-between gap-y-6">
            {modalSites.map((v, index) => linkItem(v, index, false))}
          </div>
        </Modal>
      ) : null}
    </motion.div>
  );
}
