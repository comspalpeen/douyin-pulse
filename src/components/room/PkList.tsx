// 文件位置: src/components/room/PkList.tsx
'use client';

import React from 'react';
import { Flag } from 'lucide-react';
import LivePkCard from '@/components/LivePkCard';
import PkCard from '@/components/PkCard';
import { PkBattle } from '@/types/room';

interface PkListProps {
    roomId: string;
    roomUserId?: string;
    pks: PkBattle[];
    loading: boolean;
    onRefreshPks?: () => void; 
    liveStatus?: number;
}

// ✅ 修复 1：在这里解构提取出 roomUserId
export default function PkList({ roomId, roomUserId, pks, loading, onRefreshPks, liveStatus }: PkListProps) {
    if (loading && pks.length === 0) {
        return (
            <div className="absolute inset-0 overflow-y-auto bg-background/50 p-2 md:p-4 custom-scrollbar">
                {/* ✅ 修复 2：传递 roomUserId 给 LivePkCard */}
                <LivePkCard roomId={roomId} roomUserId={roomUserId} onPkFinish={onRefreshPks} liveStatus={liveStatus} />
                <div className="py-10 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    加载战绩中...
                </div>
            </div>
        );
    }

    if (pks.length === 0) {
        return (
            <div className="absolute inset-0 overflow-y-auto bg-background/50 p-2 md:p-4 custom-scrollbar">
                {/* ✅ 修复 2：传递 roomUserId 给 LivePkCard */}
                <LivePkCard roomId={roomId} roomUserId={roomUserId} onPkFinish={onRefreshPks} liveStatus={liveStatus} />
                <div className="flex flex-col items-center py-20 text-center text-muted-foreground">
                    <Flag className="mb-4 h-8 w-8 opacity-50" />
                    <span className="font-bold uppercase tracking-widest">暂无 PK 记录</span>
                </div>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 overflow-y-auto bg-background/50 p-2 md:p-4 custom-scrollbar">
            {/* ✅ 修复 2：传递 roomUserId 给 LivePkCard */}
            <LivePkCard roomId={roomId} roomUserId={roomUserId} onPkFinish={onRefreshPks} liveStatus={liveStatus} />
            {/* ✅ 修复 3：传递 roomUserId 给历史记录卡片 PkCard */}
            {pks.map((pk) => <PkCard key={pk.battle_id} pk={pk} roomUserId={roomUserId} />)}
        </div>
    );
}