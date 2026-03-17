// 文件位置: src/hooks/useRoomData.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChatMsg, GiftMsg, PkBattle, RoomDetail, SearchTarget } from '@/types/room';

const toLocalISOString = (date: Date) => {
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    const pad3 = (n: number) => (n < 10 ? '00' + n : n < 100 ? '0' + n : n);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad3(date.getMilliseconds())}Z`;
};

function uniqueData<T>(arr: T[], keyFn: (item: T) => string): T[] {
    if (!Array.isArray(arr)) return [];
    const seen = new Set();
    return arr.filter(item => {
        const key = keyFn(item);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

// 🔥 终极无脑暴力时间组装器 (去掉了所有Clamp，去掉了所有多余时区计算)
export const parseTimeFilter = (timeStr: string | undefined, roomStart: any) => {
    if (!timeStr || !roomStart) return null;
    
    let startStr = typeof roomStart === 'string' ? roomStart : roomStart.$date;
    if (!startStr) return null;

    const [inputH, inputM] = timeStr.split(':').map(Number);
    if (isNaN(inputH) || isNaN(inputM)) return null;

    // 解析出数据库存的【伪UTC时间】里的时分和日期
    // 比如 startStr 是 "2026-02-12T15:53:08.962Z"
    const timePart = startStr.split('T')[1]; 
    const startH = parseInt(timePart.split(':')[0], 10);
    const startM = parseInt(timePart.split(':')[1], 10);

    const datePart = startStr.split('T')[0]; 
    const [year, month, day] = datePart.split('-').map(Number);

    // 用 Date.UTC 只是为了方便处理跨越自然月的进位，没有任何时区偏移
    let targetEpoch = Date.UTC(year, month - 1, day, inputH, inputM, 0, 0);

    // 唯一智能点：如果你输入的时分，比开播的时分还小，系统认定你在搜次日 (比如 23:00 开播，搜 01:00)
    if (inputH * 60 + inputM < startH * 60 + startM) {
        targetEpoch += 86400000; 
    }

    // 强制转换为 Z 结尾的文本，返回给你想要的确切时间！绝不自我阉割！
    return new Date(targetEpoch).toISOString();
};

interface SearchParams {
    appliedSearch: string; 
    searchTarget: SearchTarget; 
    minPrice: number; 
    enableMinPrice: boolean;
    filterGender?: number | null;
    filterMinPayGrade?: number;
    filterMinFansLevel?: number;
    filterStartTime?: string; 
    filterEndTime?: string; 
    searchTrigger?: number;
}

export function useRoomData(roomId: string, jumpTime: string | null, searchParams: SearchParams) {
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
        if (searchParams.filterGender !== null && searchParams.filterGender !== undefined) p += `&gender=${searchParams.filterGender}`;
        if (searchParams.filterMinPayGrade && searchParams.filterMinPayGrade > 0) p += `&min_pay_grade=${searchParams.filterMinPayGrade}`;
        if (searchParams.filterMinFansLevel && searchParams.filterMinFansLevel > 0) p += `&min_fans_club_level=${searchParams.filterMinFansLevel}`;
        return p;
    };

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

            // ✅ 解析时只传入 created_at，不传 end_time（彻底取消下播时间限制）
            if (searchParams.filterStartTime && roomInfo?.created_at) {
                const st = parseTimeFilter(searchParams.filterStartTime, roomInfo.created_at);
                if (st) url += `&start_time=${encodeURIComponent(st)}`;
            }
            if (searchParams.filterEndTime && roomInfo?.created_at) {
                const et = parseTimeFilter(searchParams.filterEndTime, roomInfo.created_at);
                if (et) url += `&end_time=${encodeURIComponent(et)}`;
            }

            if (isInitial && jumpTime) {
                const targetDate = new Date(jumpTime);
                targetDate.setSeconds(targetDate.getSeconds() + 20); 
                url += `&before_time=${encodeURIComponent(toLocalISOString(targetDate))}`;
            } else if (!isInitial && currentData.length > 0) {
                // @ts-ignore
                const sorted = [...currentData].sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
                const oldest = sorted[sorted.length - 1];
                let time = oldest.created_at; 
                if (typeof time === 'object' && (time as any).$date) time = (time as any).$date;
                if (time) url += `&before_time=${encodeURIComponent(time as string)}`;
            }

            const res = await fetch(url);
            if (!res.ok) { setLoading(false); return; }
            const newData = await res.json();
            if (!Array.isArray(newData)) { setLoading(false); return; }

            if (isInitial && jumpTime && newData.length === 0) {
                if (isChat) setJumpError(true);
                return;
            }

            if (newData.length < limit) setHasMore(false);
            // @ts-ignore
            setData(prev => {
                const combined = isInitial ? newData : [...prev, ...newData];
                // @ts-ignore
                return uniqueData(combined, item => isChat ? `${item.created_at}-${item.user_name}-${item.content}` : `${item.created_at}-${item.user_name}-${item.gift_name}-${item.combo_count}`);
            });
        } catch (e) { console.error(e); } finally { setLoading(false); }
    }, [roomId, jumpTime, searchParams, chats, gifts, hasMoreChats, hasMoreGifts, loadingChats, loadingGifts, roomInfo?.created_at]);

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
        } catch (e) { console.error(e); } finally { setLoadingPks(false); }
    }, [roomId, loadingPks, pkInitialized]);

    useEffect(() => {
        if (jumpTime) return;
        if (roomInfo && roomInfo.live_status !== 1) return;
        if (
            searchParams.filterGender !== null || 
            (searchParams.filterMinPayGrade && searchParams.filterMinPayGrade > 0) || 
            (searchParams.filterMinFansLevel && searchParams.filterMinFansLevel > 0) ||
            searchParams.filterStartTime ||
            searchParams.filterEndTime
        ) return;

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

    // 🔥 修复点：将这段代码放入 useRoomData 函数内部！
    const effectiveMinPrice = searchParams.enableMinPrice ? searchParams.minPrice : null;

    // ✅ 只监听所有的依赖，只要防抖后的值更新，立即触发拉取新数据
    useEffect(() => {
        setChats([]); setGifts([]); setHasMoreChats(true); setHasMoreGifts(true); setPkInitialized(false); setPks([]);
        loadOldData('chat', true);
        loadOldData('gift', true);
    }, [
        roomId, jumpTime, 
        searchParams.appliedSearch, 
        searchParams.searchTarget,     // 🔥 新增：监听下拉选项（全部/弹幕/礼物）
        searchParams.searchTrigger,
        searchParams.enableMinPrice, 
        effectiveMinPrice,             // 🔥 使用衍生出来的值
        searchParams.filterGender, searchParams.filterMinPayGrade, searchParams.filterMinFansLevel,
        searchParams.filterStartTime, searchParams.filterEndTime 
    ]);

    return {
        roomInfo, chats, gifts, pks,
        loadingChats, loadingGifts, loadingPks,
        loadOldChats: () => loadOldData('chat'),
        loadOldGifts: () => loadOldData('gift'),
        loadPks, jumpError, pkInitialized 
    };
}