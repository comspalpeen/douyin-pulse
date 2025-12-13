import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChatMsg, GiftMsg, PkBattle, RoomDetail, SearchTarget } from '@/types/room';

// 恢复：旧版的时间转换函数 (负负得正，解决时区问题)
const toLocalISOString = (date: Date) => {
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    const pad3 = (n: number) => (n < 10 ? '00' + n : n < 100 ? '0' + n : n);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad3(date.getMilliseconds())}Z`;
};

// 去重工具 (带防御)
function uniqueData<T>(arr: T[], keyFn: (item: T) => string): T[] {
    if (!Array.isArray(arr)) {
        console.warn("[uniqueData] Received non-array data:", arr);
        return [];
    }
    const seen = new Set();
    return arr.filter(item => {
        const key = keyFn(item);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

// 接口定义 (移除时间)
interface SearchParams {
    appliedSearch: string; 
    searchTarget: SearchTarget; 
    minPrice: number; 
    enableMinPrice: boolean;
    filterGender?: number | null;
    filterMinPayGrade?: number;
    filterMinFansLevel?: number;
}

export function useRoomData(
    roomId: string, 
    jumpTime: string | null, 
    searchParams: SearchParams
) {
    const { data: roomInfo } = useQuery<RoomDetail>({
        queryKey: ['room', roomId, 'detail'],
        queryFn: async () => (await fetch(`/api/rooms/${roomId}/detail`)).json(),
        refetchInterval: (query) => {
            if (jumpTime) return false; 
            if (query.state.data?.live_status === 4) return false; 
            return 5000;
        },
    });

    const [chats, setChats] = useState<ChatMsg[]>([]);
    const [gifts, setGifts] = useState<GiftMsg[]>([]);
    const [pks, setPks] = useState<PkBattle[]>([]);
    
    const [loadingChats, setLoadingChats] = useState(false);
    const [loadingGifts, setLoadingGifts] = useState(false);
    const [loadingPks, setLoadingPks] = useState(false);
    
    const [hasMoreChats, setHasMoreChats] = useState(true);
    const [hasMoreGifts, setHasMoreGifts] = useState(true);
    const [pkInitialized, setPkInitialized] = useState(false);
    const [jumpError, setJumpError] = useState(false);

    const abortControllerRef = useRef<AbortController | null>(null);

    // 参数构造 (移除时间)
    const getCommonParams = (limit: number, type: 'chat' | 'gift') => {
        let p = `limit=${limit}`;
        
        if (searchParams.appliedSearch) {
            if (searchParams.searchTarget === 'all' || searchParams.searchTarget === type) {
                p += `&keyword=${encodeURIComponent(searchParams.appliedSearch)}`;
            }
        }
        
        if (type === 'gift' && searchParams.enableMinPrice && searchParams.minPrice >= 0) {
            p += `&min_price=${searchParams.minPrice + 1}`;
        }

        if (searchParams.filterGender !== null && searchParams.filterGender !== undefined) {
            p += `&gender=${searchParams.filterGender}`;
        }
        if (searchParams.filterMinPayGrade && searchParams.filterMinPayGrade > 0) {
            p += `&min_pay_grade=${searchParams.filterMinPayGrade}`;
        }
        if (searchParams.filterMinFansLevel && searchParams.filterMinFansLevel > 0) {
            p += `&min_fans_club_level=${searchParams.filterMinFansLevel}`;
        }

        return p;
    };

    // --- 加载历史数据 (通用逻辑) ---
    const loadOldData = useCallback(async (type: 'chat' | 'gift', isInitial = false) => {
        const isChat = type === 'chat';
        const setLoading = isChat ? setLoadingChats : setLoadingGifts;
        const setHasMore = isChat ? setHasMoreChats : setHasMoreGifts;
        const setData = isChat ? setChats : setGifts;
        const currentData = isChat ? chats : gifts;
        const hasMore = isChat ? hasMoreChats : hasMoreGifts;

        if (loadingChats && isChat) return;
        if (loadingGifts && !isChat) return;
        if (!isInitial && !hasMore) return;

        setLoading(true);
        try {
            const limit = (isInitial && jumpTime) ? 50 : 50;
            let url = `/api/rooms/${roomId}/${type}s?${getCommonParams(limit, type)}`;

            if (isInitial && jumpTime) {
                const targetDate = new Date(jumpTime);
                targetDate.setSeconds(targetDate.getSeconds() + 20); 
                url += `&before_time=${toLocalISOString(targetDate)}`;
            } else if (!isInitial && currentData.length > 0) {
                // @ts-ignore
                const sorted = [...currentData].sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
                const oldest = sorted[sorted.length - 1];
                // @ts-ignore
                const time = oldest.created_at || oldest.event_time || oldest.send_time;
                if (time) url += `&before_time=${time}`;
            }

            const res = await fetch(url);
            
            if (!res.ok) {
                console.error(`API Error ${res.status} for ${url}`);
                setLoading(false);
                return;
            }

            const newData = await res.json();

            if (!Array.isArray(newData)) {
                console.warn("API response is not an array:", newData);
                setLoading(false);
                return;
            }

            if (isInitial && jumpTime && newData.length === 0) {
                if (isChat) setJumpError(true);
                const fallbackRes = await fetch(`/api/rooms/${roomId}/${type}s?${getCommonParams(50, type)}`);
                if (fallbackRes.ok) {
                    const fallbackData = await fallbackRes.json();
                    if (Array.isArray(fallbackData)) {
                        // @ts-ignore
                        setData(fallbackData);
                    }
                }
                return;
            }

            if (newData.length < limit) setHasMore(false);

            // @ts-ignore
            setData(prev => {
                const combined = isInitial ? newData : [...prev, ...newData];
                // @ts-ignore
                return uniqueData(combined, item => isChat ? `${item.created_at}-${item.user_name}-${item.content}` : `${item.created_at}-${item.user_name}-${item.gift_name}-${item.combo_count}`);
            });

        } catch (e) {
            console.error("loadOldData error:", e);
        } finally {
            setLoading(false);
        }
    }, [roomId, jumpTime, searchParams, chats, gifts, hasMoreChats, hasMoreGifts, loadingChats, loadingGifts]);

    const loadPks = useCallback(async () => {
        if (loadingPks || pkInitialized) return;
        setLoadingPks(true);
        try {
            const res = await fetch(`/api/rooms/${roomId}/pks?limit=50`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setPks(prev => uniqueData([...data, ...prev], p => p.battle_id));
                    setPkInitialized(true);
                }
            }
        } catch (e) {
            console.error("loadPks error:", e);
        } finally {
            setLoadingPks(false);
        }
    }, [roomId, loadingPks, pkInitialized]);

    useEffect(() => {
        if (jumpTime) return;
        if (roomInfo && roomInfo.live_status !== 1) return;
        // 如果有任何高级筛选，停止实时轮询
        if (searchParams.filterGender !== null || (searchParams.filterMinPayGrade && searchParams.filterMinPayGrade > 0) || (searchParams.filterMinFansLevel && searchParams.filterMinFansLevel > 0)) return;

        const interval = setInterval(async () => {
            try {
                const [resChats, resGifts] = await Promise.all([
                    fetch(`/api/rooms/${roomId}/chats?${getCommonParams(20, 'chat')}`),
                    fetch(`/api/rooms/${roomId}/gifts?${getCommonParams(20, 'gift')}`)
                ]);

                if (resChats.ok) {
                    const newChats = await resChats.json();
                    if (Array.isArray(newChats) && newChats.length > 0) {
                        setChats(p => uniqueData([...newChats, ...p], i => `${i.created_at}-${i.user_name}-${i.content}`).slice(0, 1000));
                    }
                }
                
                if (resGifts.ok) {
                    const newGifts = await resGifts.json();
                    if (Array.isArray(newGifts) && newGifts.length > 0) {
                        setGifts(p => uniqueData([...newGifts, ...p], i => `${i.created_at}-${i.user_name}-${i.gift_name}-${i.combo_count}`).slice(0, 1000));
                    }
                }
            } catch (e) { console.error(e); }
        }, 3000);
        return () => clearInterval(interval);
    }, [roomId, jumpTime, roomInfo, searchParams]);

    // --- 监听筛选变化 ---
    useEffect(() => {
        setChats([]); setGifts([]); setHasMoreChats(true); setHasMoreGifts(true); setPkInitialized(false); setPks([]);
        loadOldData('chat', true);
        loadOldData('gift', true);
    }, [
        roomId, 
        jumpTime, 
        searchParams.appliedSearch, 
        searchParams.enableMinPrice,
        searchParams.minPrice,
        searchParams.filterGender,
        searchParams.filterMinPayGrade,
        searchParams.filterMinFansLevel,
    ]);

    return {
        roomInfo, chats, gifts, pks,
        loadingChats, loadingGifts, loadingPks,
        loadOldChats: () => loadOldData('chat'),
        loadOldGifts: () => loadOldData('gift'),
        loadPks,
        jumpError,
        pkInitialized 
    };
}