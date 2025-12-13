'use client';

import React from 'react';
import PkCard from '@/components/PkCard';
import { PkBattle } from '@/types/room';

interface PkListProps {
    pks: PkBattle[];
    loading: boolean;
}

export default function PkList({ pks, loading }: PkListProps) {
    if (loading && pks.length === 0) {
        return <div className="text-center py-10 text-gray-400">加载战绩中...</div>;
    }
    if (pks.length === 0) {
        return <div className="text-center py-20 text-gray-400 flex flex-col items-center"><span className="text-4xl mb-2">🏳️</span>暂无 PK 记录</div>;
    }

    return (
        <div className="absolute inset-0 overflow-y-auto p-2 md:p-4 custom-scrollbar bg-gray-50/50 dark:bg-black/20">
            {pks.map((pk) => <PkCard key={pk.battle_id} pk={pk} />)}
        </div>
    );
}