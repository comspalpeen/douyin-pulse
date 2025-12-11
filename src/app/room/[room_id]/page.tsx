'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { ChatMsg, GiftMsg, SearchTarget, PkBattle, RoomDetail } from '@/types/room';
import PkCard from '@/components/PkCard';
import StatsModal from '@/components/StatsModal';

const MAX_LIST_SIZE = 1000; 
const INITIAL_LIMIT = 50;
const JUMP_LIMIT = 50; 

// --- 工具：强力去重 ---
function uniqueData<T>(arr: T[], keyFn: (item: T) => string): T[] {
    const seen = new Set();
    return arr.filter(item => {
        const key = keyFn(item);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

// --- 核心修复工具：生成保留本地时间的 ISO 字符串 ---
// 解决 "DB存的是北京时间但标着Z，查询时标准toISOString会减8小时导致查不到" 的问题
function toLocalISOString(date: Date) {
    const pad = (num: number) => (num < 10 ? '0' : '') + num;
    const pad3 = (num: number) => (num < 10 ? '00' : num < 100 ? '0' : '') + num;
    
    return (
        date.getFullYear() +
        '-' +
        pad(date.getMonth() + 1) +
        '-' +
        pad(date.getDate()) +
        'T' +
        pad(date.getHours()) +
        ':' +
        pad(date.getMinutes()) +
        ':' +
        pad(date.getSeconds()) +
        '.' +
        pad3(date.getMilliseconds()) +
        'Z'
    );
}

// --- 辅助 Hook ---
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

const BadgeIcons = ({ msg }: { msg: ChatMsg | GiftMsg }) => {
    return (
        <div className="flex items-center gap-1 mr-1 flex-shrink-0">
            {msg.pay_grade_icon && <img src={msg.pay_grade_icon} alt="level" className="h-5 w-auto object-contain" />}
            {msg.fans_club_icon && <img src={msg.fans_club_icon} alt="fans" className="h-5 w-auto object-contain" />}
        </div>
    );
};

const GenderIcon = ({ gender }: { gender?: number }) => {
    if (gender === 1) return <span className="inline-flex items-center justify-center w-3 h-3 ml-1 bg-blue-100 dark:bg-blue-900 rounded-full flex-shrink-0"><svg className="w-2 h-2 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M21 9c0-4.97-4.03-9-9-9s-9 4.03-9 9c0 4.632 3.501 8.443 8 8.941v2.059h-3v2h3v2h2v-2h3v-2h-3v-2.059c4.499-.498 8-4.309 8-8.941zm-16 0c0-3.86 3.14-7 7-7s7 3.14 7 7-3.14 7-7 7-7-3.14-7-7z"/></svg></span>;
    if (gender === 2) return <span className="inline-flex items-center justify-center w-3 h-3 ml-1 bg-pink-100 dark:bg-pink-900 rounded-full flex-shrink-0"><svg className="w-2 h-2 text-pink-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2c-4.97 0-9 4.03-9 9 0 4.632 3.501 8.443 8 8.941v2.059h-3v2h3v2h2v-2h3v-2h-3v-2.059c4.499-.498 8-4.309 8-8.941 0-4.97-4.03-9-9-9zm0 14c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7z"/></svg></span>;
    return null;
};

export default function RoomDetailPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams(); 
    const room_id = params.room_id as string;

    const jumpTime = searchParams.get('jump_time');
    const highlightUid = searchParams.get('highlight_uid');

    // Data State
    const [chats, setChats] = useState<ChatMsg[]>([]);
    const [gifts, setGifts] = useState<GiftMsg[]>([]);
    const [pks, setPks] = useState<PkBattle[]>([]);
    const [roomInfo, setRoomInfo] = useState<RoomDetail | null>(null);
    
    // UI State
    const [desktopTab, setDesktopTab] = useState<'chat' | 'pk'>('chat');
    const [mobileTab, setMobileTab] = useState<'chat' | 'gift' | 'pk'>('chat');
    const [isStatsOpen, setIsStatsOpen] = useState(false);
    const [jumpError, setJumpError] = useState(false);

    // Loading & Flags
    const [loadingChats, setLoadingChats] = useState(false);
    const [loadingGifts, setLoadingGifts] = useState(false);
    const [loadingPks, setLoadingPks] = useState(false);
    const [hasMoreChats, setHasMoreChats] = useState(true);
    const [hasMoreGifts, setHasMoreGifts] = useState(true);
    
    const isProgrammaticScroll = useRef(false); 
    const hasJumpedRef = useRef(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Filters
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
    const handleSearch = () => { if (inputSearch !== appliedSearch) setAppliedSearch(inputSearch); };
    const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSearch(); };
    const formatTime = (t?: string) => t ? new Date(t).toLocaleTimeString('zh-CN', {hour12:false}) : '';

    const getChatParams = (limit: number) => {
        let p = `limit=${limit}`;
        if (appliedSearch && (searchTarget === 'all' || searchTarget === 'chat')) p += `&keyword=${encodeURIComponent(appliedSearch)}`;
        return p;
    };
    const getGiftParams = (limit: number) => {
        let p = `limit=${limit}`;
        if (appliedSearch && (searchTarget === 'all' || searchTarget === 'gift')) p += `&keyword=${encodeURIComponent(appliedSearch)}`;
        if (enableMinPrice && debouncedMinPrice >= 0) p += `&min_price=${debouncedMinPrice + 1}`;
        return p;
    };

    // --- 核心：加载弹幕逻辑 (修复跳转) ---
    const loadOldChats = async (isInitial = false) => {
        if (loadingChats || !hasMoreChats) return;
        
        if (abortControllerRef.current) abortControllerRef.current.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        setLoadingChats(true);
        try {
            const limit = (isInitial && jumpTime) ? JUMP_LIMIT : INITIAL_LIMIT;
            let url = `/api/rooms/${room_id}/chats?${getChatParams(limit)}`;
            
            if (isInitial && jumpTime) {
                // 🎯 修复重点：使用手动拼接的 Local ISO String
                const targetDate = new Date(jumpTime);
                targetDate.setMinutes(targetDate.getMinutes() + 1); 
                
                // 使用自定义函数替代 toISOString()
                // 这样 21:21 就会生成 "2025-xx-xxT21:31:00Z" (不减8小时)
                // 从而匹配数据库里的 "假UTC"
                const localIsoString = toLocalISOString(targetDate);
                url += `&before_time=${localIsoString}`;
            } 
            else if (!isInitial && chats.length > 0) {
                const sorted = [...chats].sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
                const oldest = sorted[sorted.length - 1];
                const time = oldest.created_at || oldest.event_time;
                if (time) url += `&before_time=${time}`;
            }
            
            const res = await fetch(url, { signal: controller.signal });
            const newBatch = await res.json();
            
            // 兜底逻辑
            if (isInitial && jumpTime && newBatch.length === 0) {
                console.warn("定位失败，回退最新");
                setJumpError(true);
                const fallbackUrl = `/api/rooms/${room_id}/chats?${getChatParams(INITIAL_LIMIT)}`;
                const fallbackRes = await fetch(fallbackUrl);
                const fallbackData = await fallbackRes.json();
                setChats(fallbackData);
                return;
            }

            if (newBatch.length < limit) setHasMoreChats(false);
            
            setChats(prev => {
                const combined = isInitial ? newBatch : [...prev, ...newBatch];
                return uniqueData(combined, (item) => `${item.created_at}-${item.user_name}-${item.content}`);
            });
        } catch (err: any) {
            if (err.name !== 'AbortError') console.error(err);
        } finally {
            setLoadingChats(false);
        }
    };

    const loadOldGifts = async (isInitial = false) => {
        if (loadingGifts || !hasMoreGifts) return;
        setLoadingGifts(true);
        try {
            const limit = isInitial ? INITIAL_LIMIT : 50;
            let url = `/api/rooms/${room_id}/gifts?${getGiftParams(limit)}`;
            if (!isInitial && gifts.length > 0) {
                const sorted = [...gifts].sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
                const oldest = sorted[sorted.length - 1];
                const time = oldest.created_at || oldest.send_time;
                if (time) url += `&before_time=${time}`;
            }
            const res = await fetch(url);
            const newBatch = await res.json();
            if (newBatch.length < limit) setHasMoreGifts(false);
            setGifts(prev => {
                const combined = isInitial ? newBatch : [...prev, ...newBatch];
                return uniqueData(combined, (item) => `${item.created_at}-${item.user_name}-${item.gift_name}-${item.combo_count}`);
            });
        } finally {
            setLoadingGifts(false);
        }
    };

    const loadPks = useCallback(async () => {
        if (loadingPks) return;
        setLoadingPks(true);
        try {
            const res = await fetch(`/api/rooms/${room_id}/pks?limit=${INITIAL_LIMIT}`);
            const data = await res.json();
            setPks(prev => uniqueData([...data, ...prev], (p) => p.battle_id));
        } finally {
            setLoadingPks(false);
        }
    }, [room_id, loadingPks]);

    const fetchRealtime = useCallback(async () => {
        if (jumpTime) return;

        const promises: Promise<any>[] = [];
        promises.push(fetch(`/api/rooms/${room_id}/chats?${getChatParams(20)}`));
        promises.push(fetch(`/api/rooms/${room_id}/gifts?${getGiftParams(20)}`));
        
        if (desktopTab === 'pk' || mobileTab === 'pk') promises.push(fetch(`/api/rooms/${room_id}/pks?limit=10`));
        else promises.push(Promise.resolve(null));

        try {
            const results = await Promise.all(promises);
            const newChats = await results[0].json();
            const newGifts = await results[1].json();
            const newPks = results[2] ? await results[2].json() : null;

            if (newChats.length > 0) {
                setChats(prev => {
                    const combined = [...newChats, ...prev];
                    const unique = uniqueData(combined, (item) => `${item.created_at}-${item.user_name}-${item.content}`);
                    const sorted = unique.sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
                    return sorted.length > MAX_LIST_SIZE ? sorted.slice(0, MAX_LIST_SIZE) : sorted;
                });
            }
            if (newGifts.length > 0) {
                setGifts(prev => {
                    const combined = [...newGifts, ...prev];
                    const unique = uniqueData(combined, (item) => `${item.created_at}-${item.user_name}-${item.gift_name}-${item.combo_count}`);
                    const sorted = unique.sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
                    return sorted.length > MAX_LIST_SIZE ? sorted.slice(0, MAX_LIST_SIZE) : sorted;
                });
            }
            if (newPks && newPks.length > 0) {
                setPks(prev => uniqueData([...newPks, ...prev], (p) => p.battle_id));
            }
        } catch (e) { console.error(e); }
    }, [room_id, appliedSearch, searchTarget, enableMinPrice, debouncedMinPrice, desktopTab, mobileTab, jumpTime]); 

    useEffect(() => {
        setChats([]); setGifts([]); setHasMoreChats(true); setHasMoreGifts(true);
        hasJumpedRef.current = false; setJumpError(false);
        
        fetch(`/api/rooms/${room_id}/detail`).then(res => res.json()).then(setRoomInfo);
        loadOldChats(true);
        loadOldGifts(true);
        
        return () => { if (abortControllerRef.current) abortControllerRef.current.abort(); };
    }, [room_id, jumpTime]);

    useEffect(() => {
        if (chats.length === 0 && !hasMoreChats) return;
        setChats([]); setHasMoreChats(true); loadOldChats(true);
    }, [appliedSearch, searchTarget]);

    useEffect(() => {
        if (gifts.length === 0 && !hasMoreGifts) return;
        setGifts([]); setHasMoreGifts(true); loadOldGifts(true);
    }, [appliedSearch, searchTarget, enableMinPrice, debouncedMinPrice]);

    useEffect(() => {
        if ((desktopTab === 'pk' || mobileTab === 'pk') && pks.length === 0) {
            loadPks();
        }
    }, [desktopTab, mobileTab, loadPks, pks.length]);

    useEffect(() => {
        const interval = setInterval(fetchRealtime, 3000);
        return () => clearInterval(interval);
    }, [fetchRealtime]);

    useEffect(() => {
        const interval = setInterval(() => {
            fetch(`/api/rooms/${room_id}/detail`).then(res => res.json()).then(setRoomInfo);
        }, 5000);
        return () => clearInterval(interval);
    }, [room_id]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>, type: 'chat' | 'gift') => {
        if (isProgrammaticScroll.current) return;
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop - clientHeight < 50) {
            type === 'chat' ? loadOldChats(false) : loadOldGifts(false);
        }
    };

    const sortedChats = useMemo(() => [...chats].sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()), [chats]);
    const sortedGifts = useMemo(() => [...gifts].sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()), [gifts]);

    // Header 状态修复
    const isLive = roomInfo?.live_status === 1;
    const getAvgOnline = () => {
        if (!roomInfo) return 0;
        const start = new Date(roomInfo.created_at).getTime();
        const end = isLive ? Date.now() : (roomInfo.end_time ? new Date(roomInfo.end_time).getTime() : Date.now());
        const durationSec = (end - start) / 1000;
        return durationSec <= 0 ? 0 : Math.floor((roomInfo.total_watch_time_sec || 0) / durationSec);
    };
    
    // ✅ 修复2：字体颜色
    const headerStatLabel = isLive ? "当前在线" : "平均在线";
    const headerStatValue = isLive ? roomInfo?.user_count : getAvgOnline();
    const headerStatColor = isLive ? "text-green-500" : "text-blue-500"; 

    // ==========================================
    // 🎨 Render List
    // ==========================================

    const renderChatList = () => (
        <div className="absolute inset-0 flex flex-col">
            <div className="p-3 border-b bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center h-[40px] md:h-[50px]">
                <span className="text-gray-900 dark:text-gray-100 font-bold text-sm md:text-base">
                    {jumpTime ? "🕰️ 历史回放" : "💬 实时弹幕"}
                </span>
                {jumpTime ? (
                    <div className="flex items-center gap-2">
                        {jumpError && <span className="text-xs text-red-500 animate-pulse font-bold">定位失败:该时段无数据</span>}
                        <button onClick={() => router.push(`/room/${room_id}`)} className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full whitespace-nowrap">
                            返回最新
                        </button>
                    </div>
                ) : (
                    loadingChats && <span className="text-xs text-blue-500 animate-pulse">刷新...</span>
                )}
            </div>
            <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-3 custom-scrollbar" onScroll={(e) => handleScroll(e, 'chat')}>
                {sortedChats.map((msg, idx) => {
                    const isHighlighted = highlightUid && msg.sec_uid === highlightUid && 
                                          Math.abs(new Date(msg.created_at!).getTime() - new Date(jumpTime || 0).getTime()) < 60000;

                    return (
                        <div 
                            key={`${msg.created_at}-${msg.sec_uid}-${idx}`}
                            ref={isHighlighted && !hasJumpedRef.current ? (el) => {
                                if (el) {
                                    isProgrammaticScroll.current = true;
                                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    hasJumpedRef.current = true;
                                    setTimeout(() => { isProgrammaticScroll.current = false; }, 1500);
                                }
                            } : null}
                            className={`flex gap-2 md:gap-3 group hover:bg-gray-50 dark:hover:bg-gray-800/50 p-1.5 rounded-lg transition-colors border-b border-gray-50 dark:border-gray-800/50 last:border-0 ${isHighlighted ? 'bg-yellow-100 dark:bg-yellow-900/30 ring-2 ring-yellow-400 shadow-lg' : ''}`}
                        >
                            <div className="relative w-10 h-10 flex-shrink-0 cursor-pointer" onClick={(e) => goToProfile(e, msg.sec_uid)}>
                                {/* ✅ 修复1：头像大小恢复原状 */}
                                <img 
                                    src={msg.avatar_url || '/default-avatar.png'} 
                                    alt="avatar" 
                                    className="w-10 h-10 rounded-full object-cover border border-transparent hover:border-blue-400"
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
                    );
                })}
                {loadingChats && chats.length === 0 && <div className="py-10 text-center text-xs text-gray-400">加载中...</div>}
                {!loadingChats && chats.length === 0 && <div className="py-10 text-center text-xs text-gray-400">暂无弹幕</div>}
            </div>
        </div>
    );

    // ... (renderGiftList, renderPkList, main return 保持不变)
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
                        <div key={`${gift.created_at}-${idx}`} className={`p-2 md:p-3 rounded-xl border ${isBig ? 'bg-pink-50 border-pink-200 dark:bg-pink-900/20' : 'bg-white border-gray-100 dark:bg-gray-800'} transition-all`}>
                            <div className="flex justify-between items-start mb-1.5 border-b border-black/5 dark:border-white/5 pb-1.5">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <div className="relative w-6 h-6 flex-shrink-0 cursor-pointer" onClick={(e) => goToProfile(e, gift.sec_uid)}>
                                        <img src={gift.avatar_url || '/default-avatar.png'} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
                                    </div>
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
                                    <div className="relative w-10 h-10 flex-shrink-0">
                                        {gift.gift_icon_url ? 
                                            <img src={gift.gift_icon_url} alt="gift" className="w-10 h-10 object-contain" /> : 
                                            <div className="w-full h-full bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center text-[10px]">无图</div>
                                        }
                                    </div>
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
             <StatsModal room={roomInfo} isOpen={isStatsOpen} onClose={() => setIsStatsOpen(false)} />
             
             <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-3 shadow-sm z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.back()} className="text-xl hover:bg-gray-100 p-1 rounded dark:text-white dark:hover:bg-gray-800">←</button>
                        <div className="flex flex-col cursor-pointer group p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" onClick={() => setIsStatsOpen(true)}>
                            <div className="flex items-center gap-2">
                                <h1 className="font-bold text-gray-900 dark:text-white truncate max-w-[150px] text-sm md:text-lg group-hover:text-blue-600 transition-colors">
                                    {roomInfo?.nickname || '加载中...'}
                                </h1>
                                <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <span className={`text-[10px] flex items-center gap-1 ${headerStatColor}`}>
                                {isLive && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>}
                                {headerStatLabel}: <span className="font-bold">{headerStatValue?.toLocaleString() || 0}</span>
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 flex-1 md:justify-end">
                        <div className="flex gap-1 w-full md:w-auto items-stretch h-[32px] md:h-[38px]">
                            <select value={searchTarget} onChange={(e) => setSearchTarget(e.target.value as SearchTarget)} className="bg-gray-100 border border-gray-300 text-gray-900 text-xs md:text-sm rounded-l-lg block p-1 md:p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none">
                                <option value="all">全部</option>
                                <option value="chat">弹幕</option>
                                <option value="gift">礼物</option>
                            </select>
                            <input type="text" className="block w-full md:w-48 p-1 md:p-2 text-xs md:text-sm text-gray-900 border-t border-b border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none" placeholder="关键词..." value={inputSearch} onChange={(e) => setInputSearch(e.target.value)} onKeyDown={handleKeyDown} />
                            <button onClick={handleSearch} className="px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm font-medium rounded-r-lg whitespace-nowrap">搜索</button>
                        </div>
                        <div className={`flex items-center rounded-lg px-2 border h-[32px] md:h-[38px] transition-colors ${enableMinPrice ? 'bg-pink-50 border-pink-200 dark:bg-pink-900/20 dark:border-pink-800' : 'bg-gray-100 border-gray-200 dark:bg-gray-800 dark:border-gray-700'}`}>
                            <input type="checkbox" checked={enableMinPrice} onChange={(e) => setEnableMinPrice(e.target.checked)} className="w-3 h-3 md:w-4 md:h-4 text-pink-600 bg-gray-100 border-gray-300 rounded cursor-pointer mr-1 md:mr-2" />
                            <span className={`text-xs mr-0.5 whitespace-nowrap ${enableMinPrice ? 'text-pink-600 font-bold' : 'text-gray-500'}`}>&gt;</span>
                            <span className="text-xs mr-1">💎</span>
                            <input type="number" className={`w-10 md:w-14 bg-transparent border-none text-xs md:text-sm focus:ring-0 p-0 text-right font-bold outline-none ${enableMinPrice ? 'text-pink-600' : 'text-gray-400'}`} value={minPriceInput} min={0} onChange={(e) => setMinPriceInput(Number(e.target.value))} />
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Tabs */}
            <div className="md:hidden flex-1 flex flex-col overflow-hidden">
                <div className="flex border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-10">
                    <button onClick={() => setMobileTab('chat')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${mobileTab === 'chat' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}>💬 弹幕</button>
                    <button onClick={() => setMobileTab('gift')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${mobileTab === 'gift' ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500'}`}>🎁 礼物</button>
                    <button onClick={() => setMobileTab('pk')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${mobileTab === 'pk' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500'}`}>⚔️ PK</button>
                </div>
                <div className="flex-1 relative bg-white dark:bg-gray-900">
                    {mobileTab === 'chat' && renderChatList()}
                    {mobileTab === 'gift' && renderGiftList()}
                    {mobileTab === 'pk' && renderPkList()}
                </div>
            </div>

            {/* Desktop Grid */}
            <main className="hidden md:grid flex-1 max-w-7xl w-full mx-auto p-4 grid-cols-3 gap-4 overflow-hidden">
                <div className="col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
                    <div className="flex border-b border-gray-100 dark:border-gray-800">
                        <button onClick={() => setDesktopTab('chat')} className={`flex-1 py-3 text-sm font-bold transition-colors ${desktopTab === 'chat' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/20' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>💬 实时弹幕</button>
                        <button onClick={() => setDesktopTab('pk')} className={`flex-1 py-3 text-sm font-bold transition-colors ${desktopTab === 'pk' ? 'text-red-600 border-b-2 border-red-600 bg-red-50/50 dark:bg-red-900/20' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>⚔️ PK 战绩</button>
                    </div>
                    <div className="flex-1 overflow-hidden relative">
                        {desktopTab === 'chat' && renderChatList()}
                        {desktopTab === 'pk' && renderPkList()}
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-hidden relative">
                         {renderGiftList()}
                    </div>
                </div>
            </main>
        </div>
    );
}