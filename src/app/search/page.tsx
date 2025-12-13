'use client';

import { useState, useEffect, Suspense, useRef, useCallback } from 'react'; 
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

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

function SearchContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    
    const initialQuery = searchParams.get('q') || '';

    const [keyword, setKeyword] = useState(initialQuery);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    
    // ✅ 新增分页状态
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    
    // ✅ 滚动加载的 Observer
    const observer = useRef<IntersectionObserver | null>(null);
    const loaderRef = useCallback((node: HTMLDivElement) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                // 触底加载下一页
                loadMoreData();
            }
        });
        
        if (node) observer.current.observe(node);
    }, [loading, hasMore]); // 依赖项变化时重新绑定

    // --- 核心搜索/加载函数 ---
    const fetchSearchResults = async (q: string, pageNum: number) => {
        if (!q.trim()) return;
        setLoading(true);
        setHasSearched(true);

        try {
            // 请求后端，带上 page 参数
            const res = await fetch(`/api/search/global?keyword=${encodeURIComponent(q)}&limit=20&page=${pageNum}`);
            if (res.ok) {
                const data = await res.json();
                
                // 判断是否还有更多数据 (如果返回数量少于 limit，说明到底了)
                if (data.length < 20) {
                    setHasMore(false);
                } else {
                    setHasMore(true);
                }

                // 如果是第一页，覆盖数据；否则追加数据
                setResults(prev => pageNum === 1 ? data : [...prev, ...data]);
            } else {
                console.error("搜索失败", res.status);
            }
        } catch (e) {
            console.error("搜索异常", e);
        } finally {
            setLoading(false);
        }
    };

    // --- 初始化搜索 (URL 变化) ---
    useEffect(() => {
        const query = searchParams.get('q');
        if (query) {
            setKeyword(query);
            setPage(1);       // 重置页码
            setHasMore(true); // 重置状态
            setResults([]);   // 清空列表防止闪烁
            fetchSearchResults(query, 1);
        }
    }, [searchParams]);

    // --- 加载更多 ---
    const loadMoreData = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        // 使用当前的 keyword 状态或 URL 参数
        const currentQuery = searchParams.get('q') || keyword;
        fetchSearchResults(currentQuery, nextPage);
    };

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
        
        // 1. 优先尝试现代 Clipboard API (仅支持 HTTPS 或 localhost)
        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(uid);
                alert(`✅ 复制成功！\nUID: ${uid}`);
                return;
            } catch (err) {
                console.warn('Clipboard API 失败，尝试降级方案:', err);
            }
        }

        // 2. 降级方案：使用传统的 textarea + execCommand (支持 HTTP)
        const textArea = document.createElement("textarea");
        textArea.value = uid;
        
        // 确保 textarea 不可见且不影响布局
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                alert(`✅ 复制成功！\nUID: ${uid}`);
            } else {
                throw new Error("execCommand failed");
            }
        } catch (err) {
            // 3. 如果所有方案都失败，才弹出手动复制
            prompt("复制失败，请手动复制:", uid);
        } finally {
            document.body.removeChild(textArea);
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
                            // autoFocus // 建议移除 autoFocus 以防移动端自动弹出键盘遮挡
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

            {/* 初始加载状态 */}
            {loading && page === 1 && (
                <div className="text-center py-20">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                    <p className="mt-2 text-gray-500 text-sm">正在检索...</p>
                </div>
            )}

            {!loading && hasSearched && results.length === 0 && (
                <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800">
                    <span className="text-4xl block mb-2">🤷‍♂️</span>
                    <p className="text-gray-500">未找到关于 "{keyword}" 的记录</p>
                </div>
            )}

            {/* 结果列表 */}
            <div className="space-y-4 pb-10">
                {results.map((item, idx) => (
                    <div 
                        key={`${item.room_id}-${item.created_at}-${idx}`} 
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
                                                        复制
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

                {/* ✅ 底部加载更多哨兵元素 */}
                {results.length > 0 && hasMore && (
                    <div ref={loaderRef} className="py-6 text-center">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-500"></div>
                        <span className="ml-2 text-sm text-gray-400">加载更多...</span>
                    </div>
                )}
                
                {results.length > 0 && !hasMore && (
                    <div className="py-10 text-center text-sm text-gray-300">
                        - 已经到底啦 -
                    </div>
                )}
            </div>
        </div>
    );
}

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