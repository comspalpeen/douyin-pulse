'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChatMsg, GiftMsg, SearchTarget, PkBattle, RoomDetail } from '@/types/room';
import PkCard from '@/components/PkCard';

// --- 辅助 Hook: 防抖 ---
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

// --- 辅助组件: 图标 ---
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

// --- 辅助组件: 统计面板 Modal ---
const StatsModal = ({ room, isOpen, onClose }: { room: RoomDetail | null, isOpen: boolean, onClose: () => void }) => {
    if (!isOpen || !room) return null;

    const isLive = room.live_status === 1;

    // 1. 直播时长
    const getDurationSec = () => {
        const start = new Date(room.created_at).getTime();
        const end = isLive ? Date.now() : (room.end_time ? new Date(room.end_time).getTime() : Date.now());
        return (end - start) / 1000;
    };

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}小时 ${m}分`;
    };

    // 2. 平均停留
    const getAvgStay = () => {
        if (!room.total_user_count || room.total_user_count === 0) return '0分0秒';
        const totalSeconds = room.total_watch_time_sec || 0;
        const avgSeconds = totalSeconds / room.total_user_count;
        const m = Math.floor(avgSeconds / 60);
        const s = Math.floor(avgSeconds % 60);
        return `${m}分${s}秒`;
    };

    // 3. 平均在线
    const getAvgOnline = () => {
        const duration = getDurationSec();
        if (duration <= 0) return 0;
        const totalSeconds = room.total_watch_time_sec || 0;
        return Math.floor(totalSeconds / duration);
    };

    // ✅ 4. 数字格式化工具：小于1万显示具体数字，大于1万显示w
    const formatStat = (num?: number) => {
        if (!num) return '0';
        if (num < 10000) {
            return num.toLocaleString();
        }
        return (num / 10000).toFixed(1) + 'w';
    };

    const primaryStatLabel = isLive ? "当前在线" : "平均在线";
    const primaryStatValue = isLive ? room.user_count : getAvgOnline();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                        📊 房间数据复盘
                        {!isLive && <span className="bg-gray-200 text-gray-600 text-[10px] px-1.5 py-0.5 rounded">已结束</span>}
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl leading-none">&times;</button>
                </div>
                
                <div className="p-5 space-y-4">
                    {/* 第一行：核心流量指标 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl">
                            <div className="text-xs text-blue-500 mb-1">{primaryStatLabel}</div>
                            <div className="text-2xl font-black text-blue-700 dark:text-blue-400">{primaryStatValue.toLocaleString()}</div>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-xl">
                            <div className="text-xs text-purple-500 mb-1">峰值在线 (Max)</div>
                            <div className="text-2xl font-black text-purple-700 dark:text-purple-400">{room.max_viewers?.toLocaleString() || '-'}</div>
                        </div>
                    </div>

                    {/* 第二行：互动指标 (应用 formatStat) */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2.5 rounded-xl text-center">
                            <div className="text-[10px] text-yellow-600 dark:text-yellow-400 uppercase">粉丝团灯牌</div>
                            <div className="text-lg font-bold text-yellow-700 dark:text-yellow-300">{formatStat(room.fans_ticket_count)}</div>
                        </div>
                        <div className="bg-cyan-50 dark:bg-cyan-900/20 p-2.5 rounded-xl text-center">
                            <div className="text-[10px] text-cyan-600 dark:text-cyan-400 uppercase">弹幕总数</div>
                            <div className="text-lg font-bold text-cyan-700 dark:text-cyan-300">{formatStat(room.total_chat_count)}</div>
                        </div>
                        <div className="bg-rose-50 dark:bg-rose-900/20 p-2.5 rounded-xl text-center">
                            <div className="text-[10px] text-rose-600 dark:text-rose-400 uppercase">钻石营收</div>
                            <div className="text-lg font-bold text-rose-700 dark:text-rose-300">{formatStat(room.total_diamond_count)}</div>
                        </div>
                    </div>

                    {/* 第三行：累计数据 (应用 formatStat) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-pink-50 dark:bg-pink-900/20 p-3 rounded-xl">
                            <div className="text-xs text-pink-500 mb-1">累计点赞</div>
                            <div className="text-xl font-black text-pink-700 dark:text-pink-400">{formatStat(room.like_count)}</div>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-xl">
                            <div className="text-xs text-orange-500 mb-1">累计观看</div>
                            <div className="text-xl font-black text-orange-700 dark:text-orange-400">{formatStat(room.total_user_count)}</div>
                        </div>
                    </div>

                    {/* 第四行：粘性指标 */}
                    <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-xl flex justify-between items-center border border-teal-100 dark:border-teal-800">
                        <div>
                            <div className="text-xs text-teal-600 dark:text-teal-400 mb-1 uppercase tracking-wider">人均停留时长</div>
                            <div className="text-2xl font-black text-teal-700 dark:text-teal-300 font-mono">{getAvgStay()}</div>
                        </div>
                        <div className="text-right opacity-50">
                            <svg className="w-8 h-8 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                    </div>

                    {/* 第五行：基础信息 */}
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl flex justify-between items-center text-sm">
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500">直播时长</span>
                            <span className="font-bold dark:text-white">{formatDuration(getDurationSec())}</span>
                        </div>
                        <div className="flex flex-col text-right">
                            <span className="text-xs text-gray-500">本场涨粉</span>
                            <span className={`font-bold ${(room.follower_diff || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {(room.follower_diff || 0) > 0 ? '+' : ''}{formatStat(room.follower_diff)}
                            </span>
                        </div>
                    </div>
                    
                    <div className="text-center text-[10px] text-gray-400 pt-2 border-t dark:border-gray-800">
                        开播时间: {new Date(room.created_at).toLocaleString()}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- 主页面组件 ---
export default function RoomDetailPage() {
    const params = useParams();
    const router = useRouter();
    const room_id = params.room_id as string;

    // --- 数据状态 ---
    const [chats, setChats] = useState<ChatMsg[]>([]);
    const [gifts, setGifts] = useState<GiftMsg[]>([]);
    const [pks, setPks] = useState<PkBattle[]>([]);
    const [roomInfo, setRoomInfo] = useState<RoomDetail | null>(null);
    
    // --- UI 状态 ---
    const [desktopTab, setDesktopTab] = useState<'chat' | 'pk'>('chat');
    const [mobileTab, setMobileTab] = useState<'chat' | 'gift' | 'pk'>('chat');
    const [isStatsOpen, setIsStatsOpen] = useState(false);

    // --- 加载状态 ---
    const [loadingChats, setLoadingChats] = useState(false);
    const [loadingGifts, setLoadingGifts] = useState(false);
    const [loadingPks, setLoadingPks] = useState(false);
    const [hasMoreChats, setHasMoreChats] = useState(true);
    const [hasMoreGifts, setHasMoreGifts] = useState(true);

    // --- 搜索与过滤 ---
    const [searchTarget, setSearchTarget] = useState<SearchTarget>('all');
    const [inputSearch, setInputSearch] = useState<string>(""); 
    const [appliedSearch, setAppliedSearch] = useState<string>(""); 
    
    const [minPriceInput, setMinPriceInput] = useState<number>(10);
    const [enableMinPrice, setEnableMinPrice] = useState<boolean>(false);
    const debouncedMinPrice = useDebounce(minPriceInput, 500);

    const goToProfile = (e: React.MouseEvent, sec_uid?: string) => {
        e.stopPropagation();
        if (sec_uid) window.open(`https://www.douyin.com/user/${sec_uid}`, '_blank');
    };

    const handleSearch = () => {
        if (inputSearch !== appliedSearch) setAppliedSearch(inputSearch);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch();
    };

    const formatTime = (t?: string) => t ? new Date(t).toLocaleTimeString('zh-CN', {hour12:false}) : '';

    const getChatParams = (limit: number) => {
        let p = `limit=${limit}`;
        if (appliedSearch && (searchTarget === 'all' || searchTarget === 'chat')) {
            p += `&keyword=${encodeURIComponent(appliedSearch)}`;
        }
        return p;
    };

    const getGiftParams = (limit: number) => {
        let p = `limit=${limit}`;
        if (appliedSearch && (searchTarget === 'all' || searchTarget === 'gift')) {
            p += `&keyword=${encodeURIComponent(appliedSearch)}`;
        }
        if (enableMinPrice && debouncedMinPrice >= 0) {
            p += `&min_price=${debouncedMinPrice + 1}`;
        }
        return p;
    };

    const loadOldChats = async () => {
        if (loadingChats || !hasMoreChats) return;
        setLoadingChats(true);
        try {
            let url = `/api/rooms/${room_id}/chats?${getChatParams(50)}`;
            if (chats.length > 0) {
                const sorted = [...chats].sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
                const oldest = sorted[sorted.length - 1];
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
            let url = `/api/rooms/${room_id}/gifts?${getGiftParams(50)}`;
            if (gifts.length > 0) {
                const sorted = [...gifts].sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
                const oldest = sorted[sorted.length - 1];
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

    const loadPks = useCallback(async () => {
        setLoadingPks(true);
        try {
            const res = await fetch(`/api/rooms/${room_id}/pks?limit=50`);
            const data = await res.json();
            setPks(data);
        } finally {
            setLoadingPks(false);
        }
    }, [room_id]);

    const fetchRealtime = useCallback(async () => {
        const chatUrl = `/api/rooms/${room_id}/chats?${getChatParams(20)}`;
        const giftUrl = `/api/rooms/${room_id}/gifts?${getGiftParams(20)}`;
        const promises: Promise<any>[] = [fetch(chatUrl), fetch(giftUrl)];
        
        if (desktopTab === 'pk' || mobileTab === 'pk') {
            promises.push(fetch(`/api/rooms/${room_id}/pks?limit=10`));
        }

        try {
            const results = await Promise.all(promises);
            const newChats = await results[0].json();
            const newGifts = await results[1].json();
            const newPks = results[2] ? await results[2].json() : null;

            if (newChats.length > 0) {
                setChats(prev => {
                    if (prev.length === 0) return newChats;
                    const topTime = new Date(prev[0].created_at!).getTime();
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

            if (newPks && newPks.length > 0) {
                setPks(prev => {
                    const ids = new Set(prev.map(p => p.battle_id));
                    const uniqueNew = newPks.filter((p: PkBattle) => !ids.has(p.battle_id));
                    return [...uniqueNew, ...prev];
                });
            }
        } catch (e) { console.error(e); }
    }, [room_id, appliedSearch, searchTarget, enableMinPrice, debouncedMinPrice, desktopTab, mobileTab]); 

    useEffect(() => {
        const fetchRoomDetail = async () => {
            try {
                const res = await fetch(`/api/rooms/${room_id}/detail`);
                if (res.ok) setRoomInfo(await res.json());
            } catch (e) { console.error(e); }
        };
        fetchRoomDetail();
        const interval = setInterval(fetchRoomDetail, 5000); 
        return () => clearInterval(interval);
    }, [room_id]);

    useEffect(() => {
        const resetChats = async () => {
            setChats([]);
            setHasMoreChats(true);
            setLoadingChats(true);
            try {
                const res = await fetch(`/api/rooms/${room_id}/chats?${getChatParams(50)}`);
                setChats(await res.json());
            } finally {
                setLoadingChats(false);
            }
        };
        resetChats();
    }, [appliedSearch, searchTarget, room_id]);

    useEffect(() => {
        const resetGifts = async () => {
            setGifts([]);
            setHasMoreGifts(true);
            setLoadingGifts(true);
            try {
                const res = await fetch(`/api/rooms/${room_id}/gifts?${getGiftParams(50)}`);
                setGifts(await res.json());
            } finally {
                setLoadingGifts(false);
            }
        };
        resetGifts();
    }, [appliedSearch, searchTarget, enableMinPrice, debouncedMinPrice, room_id]);

    useEffect(() => {
        if ((desktopTab === 'pk' || mobileTab === 'pk') && pks.length === 0) {
            loadPks();
        }
    }, [desktopTab, mobileTab, loadPks, pks.length]);

    useEffect(() => {
        const interval = setInterval(fetchRealtime, 3000);
        return () => clearInterval(interval);
    }, [fetchRealtime]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>, type: 'chat' | 'gift') => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop - clientHeight < 50) {
            type === 'chat' ? loadOldChats() : loadOldGifts();
        }
    };

    const sortedChats = useMemo(() => [...chats].sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()), [chats]);
    const sortedGifts = useMemo(() => [...gifts].sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()), [gifts]);

    // Header 显示逻辑
    const isLive = roomInfo?.live_status === 1;
    const getAvgOnline = () => {
        if (!roomInfo) return 0;
        const start = new Date(roomInfo.created_at).getTime();
        const end = isLive ? Date.now() : (roomInfo.end_time ? new Date(roomInfo.end_time).getTime() : Date.now());
        const durationSec = (end - start) / 1000;
        if (durationSec <= 0) return 0;
        return Math.floor((roomInfo.total_watch_time_sec || 0) / durationSec);
    };
    const headerStatLabel = isLive ? "当前在线" : "平均在线";
    const headerStatValue = isLive ? roomInfo?.user_count : getAvgOnline();

    // ==========================================
    // 🎨 子渲染函数
    // ==========================================

    const renderChatList = () => (
        <div className="absolute inset-0 flex flex-col">
            <div className="p-3 border-b bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center h-[40px] md:h-[50px]">
                <span className="text-gray-900 dark:text-gray-100 font-bold text-sm md:text-base">💬 实时弹幕</span>
                {loadingChats ? (
                    <span className="text-xs text-blue-500 animate-pulse">刷新...</span>
                ) : (
                    appliedSearch && (searchTarget === 'all' || searchTarget === 'chat') && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full truncate max-w-[150px]">🔍 {appliedSearch}</span>
                    )
                )}
            </div>
            <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-3 custom-scrollbar" onScroll={(e) => handleScroll(e, 'chat')}>
                {sortedChats.map((msg, idx) => (
                    <div key={idx} className="flex gap-2 md:gap-3 group hover:bg-gray-50 dark:hover:bg-gray-800/50 p-1.5 rounded-lg transition-colors border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                        <div className="relative flex-shrink-0">
                            <img 
                                src={msg.avatar_url || '/default-avatar.png'} 
                                className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-200 cursor-pointer hover:opacity-80 transition-opacity border border-transparent hover:border-blue-400"
                                onClick={(e) => goToProfile(e, msg.sec_uid)}
                                alt="avatar"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center flex-wrap gap-y-1 mb-0.5">
                                <BadgeIcons msg={msg} />
                                <span className="text-xs md:text-sm font-bold text-gray-700 dark:text-gray-300 truncate cursor-pointer hover:text-blue-500 max-w-[120px]" onClick={(e) => goToProfile(e, msg.sec_uid)}>{msg.user_name}</span>
                                <GenderIcon gender={msg.gender} />
                                <span className="text-[10px] md:text-xs text-gray-300 ml-auto whitespace-nowrap pl-2">{formatTime(msg.created_at || msg.event_time)}</span>
                            </div>
                            <div className="text-xs md:text-sm text-gray-800 dark:text-gray-200 break-words leading-relaxed">{msg.content}</div>
                        </div>
                    </div>
                ))}
                {loadingChats && chats.length === 0 && <div className="py-10 text-center text-xs text-gray-400">加载中...</div>}
                {!loadingChats && chats.length === 0 && <div className="py-10 text-center text-xs text-gray-400">暂无弹幕</div>}
            </div>
        </div>
    );

    const renderGiftList = () => (
        <div className="absolute inset-0 flex flex-col">
            <div className="p-3 border-b bg-gray-50 dark:bg-gray-800/50 font-bold text-gray-900 dark:text-gray-100 flex justify-between items-center h-[40px] md:h-[50px]">
                <span className="text-sm md:text-base">🎁 礼物</span>
                <div className="flex gap-2 items-center">
                    {loadingGifts && <span className="text-xs text-pink-500 animate-pulse">刷新...</span>}
                    {enableMinPrice && <span className="text-xs bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full">&gt;{debouncedMinPrice}钻</span>}
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar bg-gray-50/30 dark:bg-black/20" onScroll={(e) => handleScroll(e, 'gift')}>
                 {sortedGifts.map((gift, idx) => {
                    const isBig = gift.total_diamond_count >= 100;
                    const displayCount = gift.combo_count * (gift.group_count || 1);
                    return (
                        <div key={idx} className={`p-2 md:p-3 rounded-xl border ${isBig ? 'bg-pink-50 border-pink-200 dark:bg-pink-900/20' : 'bg-white border-gray-100 dark:bg-gray-800'} transition-all`}>
                            <div className="flex justify-between items-start mb-1.5 border-b border-black/5 dark:border-white/5 pb-1.5">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <img src={gift.avatar_url} className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-gray-200 flex-shrink-0 cursor-pointer" onClick={(e) => goToProfile(e, gift.sec_uid)} alt="avatar" />
                                    <div className="min-w-0 flex items-center gap-1">
                                         <span className="text-xs font-bold truncate text-gray-700 dark:text-gray-300 cursor-pointer hover:text-blue-500 max-w-[80px]" onClick={(e) => goToProfile(e, gift.sec_uid)}>{gift.user_name}</span>
                                         <BadgeIcons msg={gift} />
                                         <GenderIcon gender={gift.gender} />
                                    </div>
                                </div>
                                <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">{formatTime(gift.created_at)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {gift.gift_icon_url ? <img src={gift.gift_icon_url} className="w-8 h-8 md:w-10 md:h-10 object-contain" alt="gift" /> : <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center text-[10px]">无图</div>}
                                    <div className="flex flex-col justify-center">
                                        <div className="flex items-baseline gap-1 md:gap-2">
                                            <span className="text-xs md:text-sm font-medium text-gray-800 dark:text-gray-200">{gift.gift_name}</span>
                                            <span className="text-lg md:text-xl font-bold text-orange-500 italic">x{displayCount}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="flex items-baseline gap-0.5"><span className="text-xs text-pink-400">💎</span><span className="text-xl md:text-2xl font-black text-pink-500 italic leading-none">{gift.total_diamond_count}</span></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {loadingGifts && gifts.length === 0 && <div className="py-10 text-center text-xs text-gray-400">加载中...</div>}
                {!loadingGifts && gifts.length === 0 && <div className="py-10 text-center text-xs text-gray-400">暂无礼物</div>}
            </div>
        </div>
    );

    const renderPkList = () => (
        <div className="absolute inset-0 overflow-y-auto p-2 md:p-4 custom-scrollbar bg-gray-50/50 dark:bg-black/20">
            {loadingPks && pks.length === 0 && <div className="text-center py-10 text-gray-400">加载战绩中...</div>}
            {!loadingPks && pks.length === 0 ? (
                <div className="text-center py-20 text-gray-400 flex flex-col items-center"><span className="text-4xl mb-2">🏳️</span>暂无 PK 记录</div>
            ) : (
                pks.map((pk) => <PkCard key={pk.battle_id} pk={pk} />)
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col h-screen overflow-hidden">
             
             {/* 统计面板 Modal */}
             <StatsModal room={roomInfo} isOpen={isStatsOpen} onClose={() => setIsStatsOpen(false)} />

             {/* Header */}
             <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-3 shadow-sm z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.back()} className="text-xl hover:bg-gray-100 p-1 rounded dark:text-white dark:hover:bg-gray-800">←</button>
                        
                        {/* 增大点击区域 */}
                        <div 
                            className="flex flex-col cursor-pointer group p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" 
                            onClick={() => setIsStatsOpen(true)}
                        >
                            <div className="flex items-center gap-2">
                                <h1 className="font-bold text-gray-900 dark:text-white truncate max-w-[150px] text-sm md:text-lg group-hover:text-blue-600 transition-colors">
                                    {roomInfo?.nickname || '加载中...'}
                                </h1>
                                <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <span className="text-[10px] text-green-500 flex items-center gap-1">
                                {isLive && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>}
                                {headerStatLabel}: <span className="font-bold text-gray-700 dark:text-gray-300">{headerStatValue?.toLocaleString() || 0}</span>
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 flex-1 md:justify-end">
                        {/* 搜索组 */}
                        <div className="flex gap-1 w-full md:w-auto items-stretch h-[32px] md:h-[38px]">
                            <select 
                                value={searchTarget}
                                onChange={(e) => setSearchTarget(e.target.value as SearchTarget)}
                                className="bg-gray-100 border border-gray-300 text-gray-900 text-xs md:text-sm rounded-l-lg block p-1 md:p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none"
                            >
                                <option value="all">全部</option>
                                <option value="chat">弹幕</option>
                                <option value="gift">礼物</option>
                            </select>
                            <input 
                                type="text" 
                                className="block w-full md:w-48 p-1 md:p-2 text-xs md:text-sm text-gray-900 border-t border-b border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none" 
                                placeholder="关键词..." 
                                value={inputSearch}
                                onChange={(e) => setInputSearch(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            <button 
                                onClick={handleSearch}
                                className="px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm font-medium rounded-r-lg whitespace-nowrap"
                            >
                                搜索
                            </button>
                        </div>

                        {/* 价格过滤器 */}
                        <div className={`flex items-center rounded-lg px-2 border h-[32px] md:h-[38px] transition-colors ${enableMinPrice ? 'bg-pink-50 border-pink-200 dark:bg-pink-900/20 dark:border-pink-800' : 'bg-gray-100 border-gray-200 dark:bg-gray-800 dark:border-gray-700'}`}>
                            <input 
                                type="checkbox"
                                checked={enableMinPrice}
                                onChange={(e) => setEnableMinPrice(e.target.checked)}
                                className="w-3 h-3 md:w-4 md:h-4 text-pink-600 bg-gray-100 border-gray-300 rounded cursor-pointer mr-1 md:mr-2"
                            />
                            <span className={`text-xs mr-0.5 whitespace-nowrap ${enableMinPrice ? 'text-pink-600 font-bold' : 'text-gray-500'}`}>&gt;</span>
                            <span className="text-xs mr-1">💎</span>
                            <input 
                                type="number" 
                                className={`w-10 md:w-14 bg-transparent border-none text-xs md:text-sm focus:ring-0 p-0 text-right font-bold outline-none ${enableMinPrice ? 'text-pink-600' : 'text-gray-400'}`}
                                value={minPriceInput}
                                min={0}
                                onChange={(e) => setMinPriceInput(Number(e.target.value))}
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* =======================
                📱 移动端布局 (Mobile)
                ======================= */}
            <div className="md:hidden flex-1 flex flex-col overflow-hidden">
                <div className="flex border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-10">
                    <button onClick={() => setMobileTab('chat')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${mobileTab === 'chat' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}>
                        💬 弹幕
                    </button>
                    <button onClick={() => setMobileTab('gift')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${mobileTab === 'gift' ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500'}`}>
                        🎁 礼物
                    </button>
                    <button onClick={() => setMobileTab('pk')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${mobileTab === 'pk' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500'}`}>
                        ⚔️ PK
                    </button>
                </div>
                <div className="flex-1 relative bg-white dark:bg-gray-900">
                    {mobileTab === 'chat' && renderChatList()}
                    {mobileTab === 'gift' && renderGiftList()}
                    {mobileTab === 'pk' && renderPkList()}
                </div>
            </div>

            {/* =======================
                💻 桌面端布局 (Desktop)
                ======================= */}
            <main className="hidden md:grid flex-1 max-w-7xl w-full mx-auto p-4 grid-cols-3 gap-4 overflow-hidden">
                
                {/* 左侧 (弹幕/PK 切换) */}
                <div className="col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
                    <div className="flex border-b border-gray-100 dark:border-gray-800">
                        <button onClick={() => setDesktopTab('chat')} className={`flex-1 py-3 text-sm font-bold transition-colors ${desktopTab === 'chat' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/20' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                            💬 实时弹幕
                        </button>
                        <button onClick={() => setDesktopTab('pk')} className={`flex-1 py-3 text-sm font-bold transition-colors ${desktopTab === 'pk' ? 'text-red-600 border-b-2 border-red-600 bg-red-50/50 dark:bg-red-900/20' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                            ⚔️ PK 战绩
                        </button>
                    </div>
                    <div className="flex-1 overflow-hidden relative">
                        {desktopTab === 'chat' && renderChatList()}
                        {desktopTab === 'pk' && renderPkList()}
                    </div>
                </div>

                {/* 右侧 (固定礼物栏) */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-hidden relative">
                         {renderGiftList()}
                    </div>
                </div>
            </main>
        </div>
    );
}