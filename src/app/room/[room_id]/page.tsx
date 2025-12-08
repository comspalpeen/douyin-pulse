'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

// --- 1. 类型定义 ---
interface ChatMsg {
    user_name: string;
    content: string;
    avatar_url?: string;
    sec_uid?: string;
    gender?: number; 
    pay_grade_icon?: string; 
    fans_club_icon?: string; 
    created_at?: string;
    event_time?: string;
}

interface GiftMsg {
    user_name: string;
    gift_name: string;
    gift_icon_url?: string;
    diamond_count: number;
    total_diamond_count: number; // int32，JS number 可安全处理
    combo_count: number;
    group_count?: number;
    avatar_url?: string;
    sec_uid?: string;
    gender?: number;
    pay_grade_icon?: string; 
    fans_club_icon?: string;
    created_at?: string;
    send_time?: string;
}

// --- 2. 辅助组件 ---
const GenderIcon = ({ gender }: { gender?: number }) => {
    if (gender === 1) return <span className="inline-flex items-center justify-center w-3 h-3 ml-1 bg-blue-100 dark:bg-blue-900 rounded-full flex-shrink-0"><svg className="w-2 h-2 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M21 9c0-4.97-4.03-9-9-9s-9 4.03-9 9c0 4.632 3.501 8.443 8 8.941v2.059h-3v2h3v2h2v-2h3v-2h-3v-2.059c4.499-.498 8-4.309 8-8.941zm-16 0c0-3.86 3.14-7 7-7s7 3.14 7 7-3.14 7-7 7-7-3.14-7-7z"/></svg></span>;
    if (gender === 2) return <span className="inline-flex items-center justify-center w-3 h-3 ml-1 bg-pink-100 dark:bg-pink-900 rounded-full flex-shrink-0"><svg className="w-2 h-2 text-pink-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2c-4.97 0-9 4.03-9 9 0 4.632 3.501 8.443 8 8.941v2.059h-3v2h3v2h2v-2h3v-2h-3v-2.059c4.499-.498 8-4.309 8-8.941 0-4.97-4.03-9-9-9zm0 14c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7z"/></svg></span>;
    return null;
};

const BadgeIcons = ({ msg }: { msg: ChatMsg | GiftMsg }) => {
    return (
        <div className="flex items-center gap-1 mr-1 flex-shrink-0">
            {msg.pay_grade_icon && <img src={msg.pay_grade_icon} alt="level" className="h-4 w-auto object-contain" />}
            {msg.fans_club_icon && <img src={msg.fans_club_icon} alt="fans" className="h-4 w-auto object-contain" />}
        </div>
    );
};

// --- 3. 主页面 ---
export default function RoomDetailPage() {
    const params = useParams();
    const router = useRouter();
    const room_id = params.room_id as string;

    // 数据状态
    const [chats, setChats] = useState<ChatMsg[]>([]);
    const [gifts, setGifts] = useState<GiftMsg[]>([]);
    
    // 加载状态
    const [loadingChats, setLoadingChats] = useState(false);
    const [loadingGifts, setLoadingGifts] = useState(false);
    const [hasMoreChats, setHasMoreChats] = useState(true);
    const [hasMoreGifts, setHasMoreGifts] = useState(true);

    // 搜索与过滤状态
    const [minPrice, setMinPrice] = useState<number>(100);
    const [enableMinPrice, setEnableMinPrice] = useState<boolean>(false);
    
    // inputSearch: 输入框里的内容
    // appliedSearch: 真正生效的搜索词 (点击搜索按钮后才更新)
    const [inputSearch, setInputSearch] = useState<string>(""); 
    const [appliedSearch, setAppliedSearch] = useState<string>(""); 

    // 标记是否正在进行搜索重置（防止重置期间轮询插入数据）
    const [isResetting, setIsResetting] = useState<boolean>(false); 

    const goToProfile = (e: React.MouseEvent, sec_uid?: string) => {
        e.stopPropagation();
        if (sec_uid) window.open(`https://www.douyin.com/user/${sec_uid}`, '_blank');
    };

    // ✅ 点击搜索按钮：更新 appliedSearch，触发 useEffect 进行重置
    const handleSearch = () => {
        if (inputSearch !== appliedSearch) {
            setAppliedSearch(inputSearch);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch();
    };

    // --- 核心工具：构造参数 ---
    // 这个函数保证了无论是“加载历史”还是“实时轮询”，都使用完全一致的过滤条件
    const getApiParams = useCallback((baseLimit: number) => {
        let params = `limit=${baseLimit}`;
        if (appliedSearch) params += `&keyword=${encodeURIComponent(appliedSearch)}`;
        if (enableMinPrice && minPrice > 0) params += `&min_price=${minPrice}`;
        return params;
    }, [appliedSearch, enableMinPrice, minPrice]);

    // --- 1. 加载历史 (向上滚动) ---
    const loadOldChats = async () => {
        if (loadingChats || !hasMoreChats) return;
        setLoadingChats(true);
        try {
            let url = `/api/rooms/${room_id}/chats?${getApiParams(50)}`;
            if (chats.length > 0) {
                const oldest = chats[chats.length - 1];
                const time = oldest.created_at || oldest.event_time;
                if (time) url += `&before_time=${time}`;
            }

            const res = await fetch(url);
            const newBatch = await res.json();
            if (newBatch.length < 50) setHasMoreChats(false);
            setChats(prev => [...prev, ...newBatch]);
        } finally {
            setLoadingChats(false);
        }
    };

    const loadOldGifts = async () => {
        if (loadingGifts || !hasMoreGifts) return;
        setLoadingGifts(true);
        try {
            let url = `/api/rooms/${room_id}/gifts?${getApiParams(50)}`;
            if (gifts.length > 0) {
                const oldest = gifts[gifts.length - 1];
                const time = oldest.created_at || oldest.send_time;
                if (time) url += `&before_time=${time}`;
            }

            const res = await fetch(url);
            const newBatch = await res.json();
            if (newBatch.length < 50) setHasMoreGifts(false);
            setGifts(prev => [...prev, ...newBatch]);
        } finally {
            setLoadingGifts(false);
        }
    };

    // --- 2. 实时轮询 (Realtime) ---
    // ✅ 关键修复：依赖项包含 getApiParams。当搜索条件变了，这个函数会重建，定时器也会重置。
    // 这样保证了永远只拉取“符合当前搜索条件”的新数据。
    const fetchNewRealtime = useCallback(async () => {
        if (isResetting) return; // 正在重置列表时，暂停轮询

        try {
            const chatUrl = `/api/rooms/${room_id}/chats?${getApiParams(20)}`;
            const giftUrl = `/api/rooms/${room_id}/gifts?${getApiParams(20)}`;

            const [cRes, gRes] = await Promise.all([fetch(chatUrl), fetch(giftUrl)]);
            const newChats = await cRes.json();
            const newGifts = await gRes.json();

            // 合并逻辑：只添加比列表顶部更新的数据
            if (newChats.length > 0) {
                setChats(prev => {
                    // 如果当前列表被清空了(搜索中)，直接展示新数据
                    if (prev.length === 0) return newChats;
                    
                    const topTime = new Date(prev[0].created_at!).getTime();
                    // 严格过滤：必须是更新的时间
                    const reallyNew = newChats.filter((c: ChatMsg) => new Date(c.created_at!).getTime() > topTime);
                    return [...reallyNew, ...prev];
                });
            }
            if (newGifts.length > 0) {
                setGifts(prev => {
                    if (prev.length === 0) return newGifts;
                    
                    const topTime = new Date(prev[0].created_at!).getTime();
                    const reallyNew = newGifts.filter((g: GiftMsg) => new Date(g.created_at!).getTime() > topTime);
                    return [...reallyNew, ...prev];
                });
            }
        } catch (e) { console.error(e); }
    }, [room_id, getApiParams, isResetting]); 

    // --- Effect: 当“生效的搜索词”或“价格过滤”改变时，重置列表 ---
    useEffect(() => {
        const resetData = async () => {
            setIsResetting(true); // 🔒 锁住轮询
            setChats([]);
            setGifts([]);
            setHasMoreChats(true);
            setHasMoreGifts(true);

            try {
                // 立即请求第一页数据 (带着新的搜索参数)
                const chatUrl = `/api/rooms/${room_id}/chats?${getApiParams(50)}`;
                const giftUrl = `/api/rooms/${room_id}/gifts?${getApiParams(50)}`;

                const [cRes, gRes] = await Promise.all([fetch(chatUrl), fetch(giftUrl)]);
                const cData = await cRes.json();
                const gData = await gRes.json();

                setChats(cData);
                setGifts(gData);
            } finally {
                setIsResetting(false); // 🔓 解锁轮询
            }
        };

        resetData();
    }, [appliedSearch, minPrice, enableMinPrice, room_id, getApiParams]);

    // --- Effect: 定时器 ---
    useEffect(() => {
        const interval = setInterval(fetchNewRealtime, 3000);
        return () => clearInterval(interval);
    }, [fetchNewRealtime]);

    // 滚动监听
    const handleScroll = (e: React.UIEvent<HTMLDivElement>, type: 'chat' | 'gift') => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop - clientHeight < 50) {
            type === 'chat' ? loadOldChats() : loadOldGifts();
        }
    };

    const formatTime = (t?: string) => t ? new Date(t).toLocaleTimeString('zh-CN', {hour12:false}) : '';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col h-screen overflow-hidden">
             {/* Header */}
             <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-3 shadow-sm z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.back()} className="text-xl hover:bg-gray-100 p-1 rounded dark:text-white dark:hover:bg-gray-800">←</button>
                        <h1 className="font-bold text-gray-900 dark:text-white">控制台</h1>
                        {appliedSearch && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">过滤中: {appliedSearch}</span>}
                    </div>

                    <div className="flex items-center gap-2 flex-1 md:justify-end">
                        {/* 搜索框 */}
                        <div className="flex gap-1 w-full md:w-auto">
                            <input 
                                type="text" 
                                className="block w-full md:w-60 p-2 pl-3 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white" 
                                placeholder="搜索 用户/内容/礼物..." 
                                value={inputSearch}
                                onChange={(e) => setInputSearch(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            <button 
                                onClick={handleSearch}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg whitespace-nowrap"
                            >
                                搜索
                            </button>
                        </div>

                        {/* 价格过滤器 (勾选才生效) */}
                        <div className={`flex items-center rounded-lg px-2 border h-[38px] transition-colors ${enableMinPrice ? 'bg-pink-50 border-pink-200 dark:bg-pink-900/20 dark:border-pink-800' : 'bg-gray-100 border-gray-200 dark:bg-gray-800 dark:border-gray-700'}`}>
                            <input 
                                type="checkbox"
                                checked={enableMinPrice}
                                onChange={(e) => setEnableMinPrice(e.target.checked)}
                                className="w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 mr-2 cursor-pointer"
                            />
                            <span className={`text-xs mr-2 whitespace-nowrap ${enableMinPrice ? 'text-pink-600 font-bold' : 'text-gray-500'}`}>≥</span>
                            <input 
                                type="number" 
                                className={`w-16 bg-transparent border-none text-sm focus:ring-0 p-1 text-right font-bold outline-none ${enableMinPrice ? 'text-pink-600' : 'text-gray-400'}`}
                                value={minPrice}
                                min={0}
                                disabled={!enableMinPrice}
                                onChange={(e) => setMinPrice(Number(e.target.value))}
                            />
                            <span className="text-xs ml-1 text-gray-400">💎</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl w-full mx-auto p-2 md:p-4 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
                
                {/* 弹幕区 */}
                <div className="md:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
                    <div className="p-3 border-b bg-gray-50 dark:bg-gray-800/50 font-semibold flex justify-between">
                        <span className="text-gray-900 dark:text-gray-100">💬 实时弹幕</span>
                        {appliedSearch && <span className="text-xs text-blue-500">结果已过滤</span>}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar" onScroll={(e) => handleScroll(e, 'chat')}>
                        {chats.map((msg, idx) => (
                            <div key={idx} className="flex gap-3 group hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 rounded-lg transition-colors border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                                <div className="relative flex-shrink-0">
                                    <img 
                                        src={msg.avatar_url || '/default-avatar.png'} 
                                        className="w-10 h-10 rounded-full bg-gray-200 cursor-pointer hover:opacity-80 transition-opacity border border-transparent hover:border-blue-400"
                                        onClick={(e) => goToProfile(e, msg.sec_uid)}
                                        alt="avatar"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center flex-wrap gap-y-1 mb-1">
                                        <BadgeIcons msg={msg} />
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300 truncate cursor-pointer hover:text-blue-500" onClick={(e) => goToProfile(e, msg.sec_uid)}>
                                            {msg.user_name}
                                        </span>
                                        <GenderIcon gender={msg.gender} />
                                        <span className="text-xs text-gray-300 ml-auto whitespace-nowrap pl-2">
                                            {formatTime(msg.created_at || msg.event_time)}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-800 dark:text-gray-200 break-words leading-relaxed">
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {loadingChats && <div className="py-2 text-center text-xs text-gray-400">加载中...</div>}
                        {chats.length === 0 && !loadingChats && <div className="py-10 text-center text-gray-400">无搜索结果</div>}
                    </div>
                </div>

                {/* 礼物区 */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
                    <div className="p-3 border-b bg-gray-50 dark:bg-gray-800/50 font-semibold text-gray-900 dark:text-gray-100 flex justify-between">
                        <span>🎁 礼物记录</span>
                        {enableMinPrice && <span className="text-xs text-pink-500">过滤 ≥ {minPrice}</span>}
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar bg-gray-50/30 dark:bg-black/20" onScroll={(e) => handleScroll(e, 'gift')}>
                         {gifts.map((gift, idx) => {
                            const isBig = gift.total_diamond_count >= 100;
                            // 显示总数量 (int32 安全)
                            const displayCount = gift.combo_count * (gift.group_count || 1);

                            return (
                                <div key={idx} className={`p-3 rounded-xl border ${isBig ? 'bg-pink-50 border-pink-200 dark:bg-pink-900/20' : 'bg-white border-gray-100 dark:bg-gray-800'} transition-all`}>
                                    <div className="flex justify-between items-start mb-2 border-b border-black/5 dark:border-white/5 pb-2">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <img 
                                                src={gift.avatar_url} 
                                                className="w-6 h-6 rounded-full bg-gray-200 flex-shrink-0 cursor-pointer"
                                                onClick={(e) => goToProfile(e, gift.sec_uid)}
                                                alt="avatar"
                                            />
                                            <div className="min-w-0 flex items-center gap-1">
                                                 <span 
                                                    className="text-xs font-bold truncate text-gray-700 dark:text-gray-300 cursor-pointer hover:text-blue-500"
                                                    onClick={(e) => goToProfile(e, gift.sec_uid)}
                                                 >
                                                    {gift.user_name}
                                                 </span>
                                                 <BadgeIcons msg={gift} />
                                                 <GenderIcon gender={gift.gender} />
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                            {formatTime(gift.created_at)}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {gift.gift_icon_url ? (
                                                <img src={gift.gift_icon_url} className="w-10 h-10 object-contain" alt="gift" />
                                            ) : (
                                                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-xs text-gray-400">无图</div>
                                            )}
                                            <div className="flex flex-col justify-center">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                                        {gift.gift_name}
                                                    </span>
                                                    <span className="text-xl font-bold text-orange-500 italic">
                                                        x{displayCount}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end">
                                            <div className="flex items-baseline gap-0.5">
                                                <span className="text-xs text-pink-400">💎</span>
                                                <span className="text-2xl font-black text-pink-500 italic leading-none">
                                                    {gift.total_diamond_count}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {loadingGifts && <div className="py-2 text-center text-xs text-gray-400">加载中...</div>}
                        {gifts.length === 0 && !loadingGifts && <div className="py-10 text-center text-gray-400">无搜索结果</div>}
                    </div>
                </div>
            </main>
        </div>
    );
}