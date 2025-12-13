'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useRoomUI } from '@/hooks/useRoomUI';
import { useRoomData } from '@/hooks/useRoomData';
import StatsModal from '@/components/StatsModal';
import RoomHeader from '@/components/room/RoomHeader';
import MobileRoomView from '@/components/room/MobileRoomView';
import DesktopRoomView from '@/components/room/DesktopRoomView';
import { useEffect } from 'react';

export default function RoomDetailPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const room_id = params.room_id as string;
    const jumpTime = searchParams.get('jump_time');
    const highlightUid = searchParams.get('highlight_uid');

    // 1. 初始化 UI 状态
    const ui = useRoomUI();

    // 2. 初始化数据
    const data = useRoomData(room_id, jumpTime, {
        appliedSearch: ui.searchState.appliedSearch,
        searchTarget: ui.searchState.searchTarget,
        minPrice: ui.searchState.debouncedMinPrice,
        enableMinPrice: ui.searchState.enableMinPrice,
        
        filterGender: ui.searchState.filterGender,
        // ✅✅✅ 核心修复：这里使用防抖后的值
        // 这样只有当您停止输入 500ms 后，才会触发 API 请求
        filterMinPayGrade: ui.searchState.debouncedFilterMinPayGrade,
        filterMinFansLevel: ui.searchState.debouncedFilterMinFansLevel,
    });

    // 3. 特殊逻辑：PK Tab 激活时触发加载
    useEffect(() => {
        if ((ui.tabState.desktopTab === 'pk' || ui.tabState.mobileTab === 'pk') && !data.pkInitialized) {
            data.loadPks();
        }
    }, [ui.tabState.desktopTab, ui.tabState.mobileTab, data.pkInitialized, data]);

    // 4. 辅助函数
    const goToProfile = (e: React.MouseEvent, sec_uid?: string) => {
        e.stopPropagation();
        if (sec_uid) window.open(`https://www.douyin.com/user/${sec_uid}`, '_blank');
    };
    
    const formatTime = (t?: string) => {
        if (!t) return '';
        let dateStr = t;
        if (typeof dateStr === 'string' && dateStr.endsWith('Z')) {
            dateStr = dateStr.slice(0, -1); 
        }
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleTimeString('zh-CN', { hour12: false });
    };

    const handleReturnToLatest = () => {
        router.push(`/room/${room_id}`);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col h-screen overflow-hidden">
            
            <StatsModal 
                room={data.roomInfo || null} 
                isOpen={ui.modalState.isStatsOpen} 
                onClose={() => ui.modalState.setIsStatsOpen(false)} 
            />

            <RoomHeader 
                roomInfo={data.roomInfo} 
                searchState={ui.searchState} 
                actions={ui.actions}
                onOpenStats={() => ui.modalState.setIsStatsOpen(true)}
            />

            <MobileRoomView 
                data={data}
                tab={ui.tabState.mobileTab}
                setTab={ui.tabState.setMobileTab}
                jumpTime={jumpTime}
                highlightUid={highlightUid}
                goToProfile={goToProfile}
                formatTime={formatTime}
                onReturnToLatest={handleReturnToLatest}
            />

            <DesktopRoomView 
                data={data}
                tab={ui.tabState.desktopTab}
                setTab={ui.tabState.setDesktopTab}
                jumpTime={jumpTime}
                highlightUid={highlightUid}
                goToProfile={goToProfile}
                formatTime={formatTime}
                onReturnToLatest={handleReturnToLatest}
            />
        </div>
    );
}