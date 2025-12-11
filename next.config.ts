import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 开启图片防盗链白名单 (允许显示抖音头像)
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.douyinpic.com" },
      { protocol: "http", hostname: "**.douyinpic.com" },
      { protocol: "https", hostname: "p11.douyinpic.com" },
      { protocol: "https", hostname: "p26.douyinpic.com" },
      { protocol: "https", hostname: "p3.douyinpic.com" },
      { protocol: "https", hostname: "p3-webcast.douyinpic.com" },
      { protocol: "https", hostname: "***.byteimg.com" },
      { protocol: "http", hostname: "***.byteimg.com" },
    ],
  },
  // 代理配置：将前端 /api 请求转发到 Python 后端 (默认8000端口)
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://139.196.142.3:8000/api/:path*", 
      },
    ];
  },
};

export default nextConfig;