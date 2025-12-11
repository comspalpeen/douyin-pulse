'use client';

import { useState, useEffect } from 'react';
import AuthorCard from '../components/AuthorCard';
import { Author } from '../types/author';
import QnaModal from '@/components/QnaModal';
import { useRouter } from 'next/navigation';

export default function Home() {
    const [authors, setAuthors] = useState<Author[]>([]);
    const [loading, setLoading] = useState(true);
    // ✅ 新增：搜索框状态
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    const fetchAuthors = async () => {
        try {
            // 使用 127.0.0.1 避免 localhost 解析延迟
            const res = await fetch('/api/authors');
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();
            setAuthors(data);
        } catch (error) {
            console.error('API Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAuthors();
        const interval = setInterval(fetchAuthors, 30000); // 30秒自动刷新，所以不需要手动刷新按钮了
        return () => clearInterval(interval);
    }, []);

    // ✅ 新增：处理搜索跳转
    const handleSearch = () => {
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // 统计逻辑
    const activeCount = authors.filter(a => a.live_status === 1 || a.live_status === 2).length;

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            1103抖音直播监控台
                        </h1>
                    </div>
                    
                    {/* ✅ 修改区：搜索组合栏 (替代了原来的刷新按钮) */}
                    <div className="flex items-center shadow-sm">
                        <input 
                            type="text" 
                            placeholder="🔍 无所遁形..." 
                            className="pl-4 pr-4 py-2.5 rounded-l-lg border border-gray-200 border-r-0 focus:ring-2 focus:ring-blue-500 outline-none text-sm w-48 md:w-64 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <button 
                            onClick={handleSearch}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-r-lg text-sm font-medium transition-colors whitespace-nowrap"
                        >
                            搜索
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="text-gray-500 text-sm">监控主播</div>
                        <div className="text-2xl font-bold text-gray-500 dark:text-gray-300">{authors.length}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="text-gray-500 text-sm">正在开播/连线</div>
                        <div className="text-2xl font-bold text-red-500">
                            {activeCount}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-gray-500 animate-pulse">加载数据中...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {authors.map((author) => (
                            <AuthorCard key={author.sec_uid} author={author} />
                        ))}
                    </div>
                )}
            </div>  
            <QnaModal />
        </main>
    );
}