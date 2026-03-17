// 文件位置: src/components/room/PkList.tsx
'use client';

import React from 'react';
import PkCard from '@/components/PkCard';
import { PkBattle } from '@/types/room';
import { Flag } from 'lucide-react';

interface PkListProps {
    pks: PkBattle[];
    loading: boolean;
}

export default function PkList({ pks, loading }: PkListProps) {
    if (loading && pks.length === 0) {
        return <div className="text-center py-10 font-bold tracking-widest text-xs uppercase text-muted-foreground">加载战绩中...</div>;
    }
    if (pks.length === 0) {
        return (
            <div className="text-center py-20 text-muted-foreground flex flex-col items-center">
                <Flag className="w-8 h-8 mb-4 opacity-50" />
                <span className="font-bold tracking-widest uppercase">暂无 PK 记录</span>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 overflow-y-auto p-2 md:p-4 custom-scrollbar bg-background/50">
            {pks.map((pk) => <PkCard key={pk.battle_id} pk={pk} />)}
        </div>
    );
}