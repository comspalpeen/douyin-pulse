'use client';

import { useState, useEffect } from 'react';
import AuthorCard from '../components/AuthorCard';
import { Author } from '../types/author';

export default function Home() {
    const [authors, setAuthors] = useState<Author[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAuthors = async () => {
        try {
            // 🔧 【修复点】: 使用 127.0.0.1 代替 localhost，解决 Fetch Error
            const res = await fetch('/api/authors');

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

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
        const interval = setInterval(fetchAuthors, 30000);
        return () => clearInterval(interval);
    }, []);

    // 统计逻辑：状态 1 和 2 都视为“活跃”
    const activeCount = authors.filter(a => a.live_status === 1 || a.live_status === 2).length;

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            抖音直播监控台
                        </h1>
                    </div>
                    <button
                        onClick={fetchAuthors}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        刷新列表
                    </button>
                </header>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <div className="text-gray-500 text-sm">监控主播</div>
                        <div className="text-2xl font-bold text-gray-500">{authors.length}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <div className="text-gray-500 text-sm">正在开播/连线</div>
                        <div className="text-2xl font-bold text-red-500">
                            {activeCount}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-gray-500">加载数据中...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {authors.map((author) => (
                            <AuthorCard key={author.sec_uid} author={author} />
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}