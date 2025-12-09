'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Room {
    room_id: string;
    title: string;
    cover_url?: string;
    created_at: string;
    end_time?: string;
    max_viewers: number;
    like_count: number;
    live_status: number; // 1:直播中, 4:结束
}

interface AuthorStats {
    totalShows: number;
    totalLikes: number;
    peakViewer: number;
    lastActive: string;
}

export default function AuthorDetailPage() {
    const params = useParams();
    const router = useRouter();
    const sec_uid = params.sec_uid as string;

    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    
    // 模拟的主播信息 (实际项目中建议增加一个 /api/authors/{sec_uid} 接口获取详情)
    // 这里我们暂时从最新的直播记录中提取主播信息作为兜底
    const [authorInfo, setAuthorInfo] = useState<{name: string, avatar: string}>({ name: '加载中...', avatar: '' });

    useEffect(() => {
        if (!sec_uid) return;
        const fetchRooms = async () => {
            try {
                const res = await fetch(`/api/authors/${sec_uid}/rooms`);
                if (res.ok) {
                    const data = await res.json();
                    setRooms(data);
                    
                    // 尝试从第一条记录提取主播信息 (临时方案)
                    // 如果你有单独的获取主播详情接口，请在这里调用替换
                    if (data.length > 0) {
                        // 注意：这里假设 api 返回的 rooms 里虽然没直接带主播头像，但我们可以先用默认图
                        // 如果后端 rooms 接口补全了 owner 信息会更好
                        // 这里暂时只更新状态，实际信息展示需依赖数据源
                    }
                }
            } catch (error) {
                console.error('Fetch error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchRooms();
    }, [sec_uid]);

    // --- 核心：前端聚合统计数据 ---
    const stats: AuthorStats = useMemo(() => {
        if (rooms.length === 0) return { totalShows: 0, totalLikes: 0, peakViewer: 0, lastActive: '-' };
        
        let totalLikes = 0;
        let peakViewer = 0;
        
        rooms.forEach(r => {
            totalLikes += r.like_count;
            if (r.max_viewers > peakViewer) peakViewer = r.max_viewers;
        });

        return {
            totalShows: rooms.length,
            totalLikes,
            peakViewer,
            lastActive: rooms[0].created_at // 列表默认倒序，第一个即最新
        };
    }, [rooms]);

    // 格式化工具
    const formatDate = (dateString?: string) => {
        if (!dateString) return '未知时间';
        return new Date(dateString).toLocaleString('zh-CN', {
            month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
        });
    };

    const getDuration = (start: string, end?: string) => {
        if (!end) return '直播中...';
        const s = new Date(start).getTime();
        const e = new Date(end).getTime();
        const diffMin = Math.floor((e - s) / 1000 / 60);
        const hours = Math.floor(diffMin / 60);
        const mins = diffMin % 60;
        return `${hours}h ${mins}m`;
    };

    const formatNum = (num: number) => {
        return num >= 10000 ? (num / 10000).toFixed(1) + 'w' : num.toLocaleString();
    };

    const goToDouyinProfile = () => {
        window.open(`https://www.douyin.com/user/${sec_uid}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
            
            {/* 1. 顶部导航栏 (带返回键) */}
            <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20 px-4 py-3 shadow-sm">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => router.back()} 
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300"
                            title="返回上一页"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        </button>
                        <h1 className="text-lg font-bold text-gray-900 dark:text-white">主播详情</h1>
                    </div>
                    <button 
                        onClick={goToDouyinProfile}
                        className="text-xs bg-black text-white dark:bg-white dark:text-black px-3 py-1.5 rounded-full font-medium hover:opacity-80 transition-opacity"
                    >
                        访问主页 ↗
                    </button>
                </div>
            </header>

            <main className="flex-1 max-w-4xl w-full mx-auto p-4 space-y-6">
                
                {/* 2. 主播数据概览卡 (Dashboard) */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* 统计项 1 */}
                        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl">
                            <div className="text-xs text-blue-500 mb-1 font-medium">监控场次</div>
                            <div className="text-2xl font-black text-blue-700 dark:text-blue-400">{stats.totalShows}</div>
                        </div>
                        {/* 统计项 2 */}
                        <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/10 rounded-xl">
                            <div className="text-xs text-purple-500 mb-1 font-medium">历史最高在线</div>
                            <div className="text-2xl font-black text-purple-700 dark:text-purple-400">{formatNum(stats.peakViewer)}</div>
                        </div>
                        {/* 统计项 3 */}
                        <div className="text-center p-3 bg-pink-50 dark:bg-pink-900/10 rounded-xl">
                            <div className="text-xs text-pink-500 mb-1 font-medium">累计获赞</div>
                            <div className="text-2xl font-black text-pink-700 dark:text-pink-400">{formatNum(stats.totalLikes)}</div>
                        </div>
                        {/* 统计项 4 */}
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <div className="text-xs text-gray-500 mb-1 font-medium">最近开播</div>
                            <div className="text-sm font-bold text-gray-700 dark:text-gray-300 py-1.5">
                                {stats.lastActive !== '-' ? new Date(stats.lastActive).toLocaleDateString() : '-'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. 历史记录列表 (List) */}
                <div>
                    <h2 className="text-sm font-bold text-gray-500 mb-4 px-1">📄 直播记录回放 ({rooms.length})</h2>
                    
                    {loading ? (
                        <div className="text-center py-20 text-gray-400 animate-pulse">数据加载中...</div>
                    ) : rooms.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                            <span className="text-4xl block mb-2">📭</span>
                            <span className="text-gray-400 text-sm">暂无监控记录</span>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {rooms.map((room) => (
                                <div 
                                    key={room.room_id} 
                                    onClick={() => router.push(`/room/${room.room_id}`)}
                                    className="group bg-white dark:bg-gray-900 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex gap-4 cursor-pointer hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all"
                                >
                                    {/* 封面 */}
                                    <div className="w-32 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg flex-shrink-0 overflow-hidden relative">
                                        {room.cover_url ? (
                                            <img src={room.cover_url} alt="cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">无封面</div>
                                        )}
                                        {/* 状态角标 */}
                                        {room.live_status === 1 && (
                                            <div className="absolute top-1 left-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm animate-pulse">
                                                LIVE
                                            </div>
                                        )}
                                    </div>

                                    {/* 内容 */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate text-sm md:text-base group-hover:text-blue-600 transition-colors">
                                                {room.title || '无标题直播'}
                                            </h3>
                                            <div className="text-xs text-gray-400 mt-1 flex items-center gap-3">
                                                <span>📅 {formatDate(room.created_at)}</span>
                                                <span className="bg-gray-100 dark:bg-gray-800 px-1.5 rounded text-gray-500">
                                                    ⏱️ {getDuration(room.created_at, room.end_time)}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-4 text-xs">
                                            <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium">
                                                👀 {formatNum(room.max_viewers)}
                                            </span>
                                            <span className="flex items-center gap-1 text-pink-600 dark:text-pink-400 font-medium">
                                                ❤️ {formatNum(room.like_count)}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* 右侧箭头 */}
                                    <div className="flex items-center justify-center text-gray-300 group-hover:text-blue-500 transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}