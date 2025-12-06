import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    // 确保包含了你的 web 目录
    "./web/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      // --- 新增配置开始 ---
      keyframes: {
        // 定义一个轻微放大的呼吸效果
        'avatar-breathe': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.03)' }, // 放大 3%，轻微且自然
        }
      },
      animation: {
        // 定义动画工具类，时长 2s，缓动函数，无限循环
        'avatar-breathe': 'avatar-breathe 2s ease-in-out infinite',
      },
      // --- 新增配置结束 ---
    },
  },
  plugins: [],
};
export default config;