/*
 * @Author: kasuie
 * @Date: 2024-05-20 16:08:41
 * @LastEditors: kasuie
 * @LastEditTime: 2024-11-28 21:01:15
 * @Description:
 */
import type { Metadata, Viewport } from "next";
import Layout from "@/components/layout/Layout";
import { AppProviders } from "@/providers";
import { getConfig } from "@/lib/config";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import Script from "next/script";
import "@/styles/index.css";
import 'katex/dist/katex.min.css';
import StyleRegistry from "@/components/layout/StyleRegistry";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#ffffff'
};

export const metadata: Metadata = {
  title: 'Hasakiikii的主页',
  description: 'Your personal AI assistant',
  icons: {
    icon: '/ico.png',
  }
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const appConfig = await getConfig("config.json");
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`mio-scroll mio-fonts overflow-y-auto`}>
        <AppProviders appConfig={appConfig} ver={process.env.VERSION || ""}>
          <Layout>{children}</Layout>
          <StyleRegistry />
        </AppProviders>
        {process.env.GTAGID && <GoogleAnalytics gaId={process.env.GTAGID} />}
        {process.env.GTMID && <GoogleTagManager gtmId={process.env.GTMID} />}
        {process.env.BAIDUID && (
          <Script
            strategy={"afterInteractive"}
            src={`https://hm.baidu.com/hm.js?${process.env.BAIDUID}`}
          />
        )}
      </body>
    </html>
  );
}
