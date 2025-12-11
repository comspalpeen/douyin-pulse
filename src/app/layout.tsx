import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // 确保引入了 Tailwind 样式
import QueryProvider from "@/components/query-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "1103监控系统",
  description: "Real-time Douyin Live Data Visualization Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      {/* 强制开启深色模式背景 */}
      <body className={`${inter.className} bg-[#0b1120] text-slate-100`}>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}