'use client';

import { useState, useEffect, Suspense } from 'react'; // ✅ 新增 Suspense
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

// 定义后端返回的数据结构
interface SearchResult {
    user_name: string;
    sec_uid: string;
    avatar_url: string;
    content: string;
    created_at: string;
    room_id: string;
    anchor_name: string;
    room_title: string;
    room_cover: string;
}

// -----------------------------------------------------------------------------
// 1. 将原本的页面逻辑提取为子组件 "SearchContent"
// -----------------------------------------------------------------------------
function SearchContent() {
    const searchParams = useSearchParams(); // ✅ 在 Suspense 内部使用安全
    const router = useRouter();
    
    const initialQuery = searchParams.get('q') || '';

    const [keyword, setKeyword] = useState(initialQuery);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // --- 执行搜索 ---
    const doSearch = async (q: string) => {
        if (!q.trim()) return;
        setLoading(true);
        setHasSearched(true);
        setResults([]); 

        try {
            const res = await fetch(`/api/search/global?keyword=${encodeURIComponent(q)}&limit=50`);
            if (res.ok) {
                const data = await res.json();
                setResults(data);
            } else {
                console.error("搜索失败", res.status);
            }
        } catch (e) {
            console.error("搜索异常", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const query = searchParams.get('q');
        if (query) {
            setKeyword(query);
            doSearch(query);
        }
    }, [searchParams]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (keyword.trim()) {
            router.push(`/search?q=${encodeURIComponent(keyword)}`);
        }
    };

    const handleJumpToContext = (item: SearchResult) => {
        const ts = new Date(item.created_at).toISOString();
        const targetUrl = `/room/${item.room_id}?jump_time=${ts}&highlight_uid=${item.sec_uid}`;
        router.push(targetUrl);
    };

    const handleCopyUid = async (e: React.MouseEvent, uid: string) => {
        e.stopPropagation();
        e.preventDefault();
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(uid);
                alert(`✅ 复制成功！\nUID: ${uid}`);
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = uid;
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                    document.execCommand('copy');
                    alert(`✅ 复制成功！\nUID: ${uid}`);
                } catch (err) {
                    prompt("请手动复制:", uid);
                }
                document.body.removeChild(textArea);
            }
        } catch (err) {
            prompt("请手动复制:", uid);
        }
    };

    const formatTime = (t: string) => new Date(t).toLocaleString('zh-CN', {month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit'});

    return (
        <div className="max-w-4xl mx-auto">
            {/* 顶部搜索栏 */}
            <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-950 pb-4">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => router.push('/')} 
                        className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-100 transition-colors"
                        title="返回首页"
                    >
                        <span className="text-xl">🏠</span>
                    </button>
                    
                    <form onSubmit={handleSubmit} className="flex-1 flex gap-2 shadow-sm">
                        <input 
                            type="text" 
                            className="flex-1 p-3 pl-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none text-base md:text-lg dark:text-white transition-all"
                            placeholder="🔍 搜用户名 或 sec_uid..."
                            value={keyword}
                            onChange={e => setKeyword(e.target.value)}
                            autoFocus
                        />
                        <button 
                            type="submit" 
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-colors whitespace-nowrap"
                        >
                            搜索
                        </button>
                    </form>
                </div>
            </div>

            {/* 状态提示 */}
            {loading && (
                <div className="text-center py-20">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                    <p className="mt-2 text-gray-500 text-sm">正在全站检索足迹...</p>
                </div>
            )}

            {!loading && hasSearched && results.length === 0 && (
                <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800">
                    <span className="text-4xl block mb-2">🤷‍♂️</span>
                    <p className="text-gray-500">未找到关于 "{keyword}" 的任何发言记录</p>
                </div>
            )}

            {/* 结果列表 */}
            <div className="space-y-4">
                {!loading && results.map((item, idx) => (
                    <div 
                        key={idx} 
                        onClick={() => handleJumpToContext(item)}
                        className="group bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-blue-300 dark:border-gray-700 dark:hover:border-blue-700 transition-all cursor-pointer flex gap-4 items-start"
                    >
                        {/* 封面 */}
                        <div className="hidden md:block w-24 h-14 relative flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 dark:border-gray-700">
                            {item.room_cover ? (
                                <Image src={item.room_cover} alt="cover" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">无封面</div>
                            )}
                            <div className="absolute bottom-0 w-full bg-black/60 text-white text-[10px] text-center py-0.5 truncate px-1">
                                {item.anchor_name}
                            </div>
                        </div>

                        {/* 详情 */}
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="relative w-8 h-8 md:w-10 md:h-10 flex-shrink-0">
                                        <Image 
                                            src={item.avatar_url || '/default-avatar.png'} 
                                            alt="avatar" 
                                            fill 
                                            className="rounded-full object-cover border border-gray-200 dark:border-gray-700"
                                        />
                                    </div>
                                    
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-900 dark:text-white text-sm md:text-base">
                                                {item.user_name}
                                            </span>
                                        </div>
                                        
                                        {item.sec_uid && (
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <span className="text-[10px] text-gray-400 font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded flex items-center gap-2 border border-gray-200 dark:border-gray-700">
                                                    UID: {item.sec_uid.slice(0, 6)}...{item.sec_uid.slice(-4)}
                                                    <button 
                                                        onClick={(e) => handleCopyUid(e, item.sec_uid)}
                                                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:underline font-bold px-1"
                                                        title="点击复制完整 UID"
                                                    >
                                                        点击复制
                                                    </button>
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <span className="text-xs text-gray-400 whitespace-nowrap bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-full">
                                    {formatTime(item.created_at)}
                                </span>
                            </div>

                            <div className="bg-yellow-50 dark:bg-blue-900/10 border border-yellow-100 dark:border-blue-900/30 px-3 py-2 rounded-lg text-sm text-gray-800 dark:text-gray-200 break-all leading-relaxed">
                                {item.content}
                            </div>

                            <div className="mt-2 flex items-center gap-1 text-xs text-gray-400 group-hover:text-blue-500 transition-colors">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                <span>跳转至现场 &middot; 来自 {item.anchor_name} 的直播间</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// -----------------------------------------------------------------------------
// 2. 主页面组件 (Shell)
// ✅ 核心修复：在这里使用 Suspense 包裹 SearchContent
// -----------------------------------------------------------------------------
export default function GlobalSearchPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
            <Suspense fallback={
                <div className="flex h-screen items-center justify-center">
                    <div className="text-gray-500">正在加载搜索组件...</div>
                </div>
            }>
                <SearchContent />
            </Suspense>
        </div>
    );
}