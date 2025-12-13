'use client';

import React from 'react';
import { Virtuoso } from 'react-virtuoso';
import { GiftMsg } from '@/types/room';

interface GiftListProps {
    gifts: GiftMsg[];
    loading: boolean;
    onLoadMore: () => void;
    goToProfile: (e: React.MouseEvent, uid?: string) => void;
    formatTime: (t?: string) => string;
}

const BadgeIcons = ({ msg }: { msg: GiftMsg }) => (
    <div className="flex items-center gap-1 mr-1 flex-shrink-0">
        {msg.pay_grade_icon && <img src={msg.pay_grade_icon} alt="level" className="h-5 w-auto object-contain" />}
        {msg.fans_club_icon && <img src={msg.fans_club_icon} alt="fans" className="h-5 w-auto object-contain" />}
    </div>
);

export default function GiftList({ gifts, loading, onLoadMore, goToProfile, formatTime }: GiftListProps) {
    if (gifts.length === 0) {
        return <div className="py-20 text-center text-xs text-gray-400">{loading ? "加载中..." : "暂无礼物"}</div>;
    }

    return (
        <Virtuoso
            style={{ height: '100%' }}
            data={gifts}
            overscan={500}
            endReached={onLoadMore}
            components={{ Footer: () => (loading ? <div className="py-4 text-center text-xs text-gray-400">加载更多...</div> : null) }}
            itemContent={(index, gift) => {
                const isBig = gift.total_diamond_count >= 100;
                const displayCount = gift.combo_count * (gift.group_count || 1);
                return (
                    <div className="px-2 py-1">
                        <div className={`p-2 md:p-3 rounded-xl border ${isBig ? 'bg-pink-50 border-pink-200 dark:bg-pink-900/20' : 'bg-white border-gray-100 dark:bg-gray-800'} transition-all`}>
                            <div className="flex justify-between items-start mb-1.5 border-b border-black/5 dark:border-white/5 pb-1.5">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <div className="relative w-6 h-6 shrink-0 cursor-pointer" onClick={(e) => goToProfile(e, gift.sec_uid)}>
                                        <img src={gift.avatar_url || '/default-avatar.png'} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
                                    </div>
                                    <div className="min-w-0 flex items-center gap-1">
                                         <span className="text-xs font-bold truncate text-gray-700 dark:text-gray-300 cursor-pointer hover:text-blue-500 max-w-[80px]" onClick={(e) => goToProfile(e, gift.sec_uid)}>{gift.user_name}</span>
                                         <BadgeIcons msg={gift} />
                                    </div>
                                </div>
                                <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">{formatTime(gift.created_at)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="relative w-10 h-10 shrink-0">
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
                    </div>
                );
            }}
        />
    );
}