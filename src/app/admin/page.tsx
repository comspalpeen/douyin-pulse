"use client";
import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">控制台仪表盘</h1>
        
        {/* 卡片网格布局 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 1. 账号池管理入口 */}
          <Link href="/admin/cookies" className="block p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg hover:border-blue-300 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl">🍪</span>
              <span className="text-gray-300 group-hover:text-blue-500 text-2xl">→</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600">账号池管理</h3>
            <p className="text-gray-500 mt-2 text-sm">管理爬虫使用的抖音 Cookie，添加、更新或删除失效账号。</p>
          </Link>

          {/* 2. ✅ 新增：Q&A 管理入口 */}
          <Link href="/admin/qna" className="block p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg hover:border-purple-300 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl">💡</span>
              <span className="text-gray-300 group-hover:text-purple-500 text-2xl">→</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 group-hover:text-purple-600">常见问题 (Q&A)</h3>
            <p className="text-gray-500 mt-2 text-sm">编辑首页右下角弹出的常见问题解答内容。</p>
          </Link>

          {/* 3. (可选) 直播间监控入口 - 如果你有这个页面的话 */}
          <Link href="/" className="block p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg hover:border-green-300 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl">📺</span>
              <span className="text-gray-300 group-hover:text-green-500 text-2xl">↗</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 group-hover:text-green-600">返回前台首页</h3>
            <p className="text-gray-500 mt-2 text-sm">查看当前的直播监控列表和数据统计。</p>
          </Link>

        </div>
      </div>
    </div>
  );
}