import type { Metadata } from 'next';
import { Inter, Share_Tech_Mono, Nunito } from 'next/font/google';
import './globals.css';
import QueryProvider from '@/components/query-provider'; 
import AiChatWidget from '@/components/AiChatWidget' // 1. 引入它
const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
// 战术等宽字体
const techMono = Share_Tech_Mono({ weight: '400', subsets: ['latin'], variable: '--font-mono' });
// 甜美圆润糖果字体
const nunito = Nunito({ weight: ['400', '600', '700', '900'], subsets: ['latin'], variable: '--font-cute' });

export const metadata: Metadata = {
  title: 'TERMINAL // 1103',
  description: 'Tactical Live Monitoring Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      {/* 在 className 中注入 nunito.variable */}
      <body className={`${inter.variable} ${techMono.variable} ${nunito.variable} min-h-screen custom-scrollbar transition-colors duration-500`}>
        {/* 防闪烁脚本 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  if (localStorage.getItem('app-theme') === 'pink') {
                    document.documentElement.classList.add('theme-pink');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <QueryProvider>
          {children}
          <AiChatWidget /> {/* 2. 放在这！所有页面都会有它，且不会被销毁 */}
        </QueryProvider>
      </body>
    </html>
  );
}