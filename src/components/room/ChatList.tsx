'use client';

import React, { useRef, useEffect } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { ChatMsg } from '@/types/room';

interface ChatListProps {
    chats: ChatMsg[];
    loading: boolean;
    onLoadMore: () => void;
    jumpTime: string | null;
    highlightUid: string | null;
    goToProfile: (e: React.MouseEvent, uid?: string) => void;
    formatTime: (t?: string) => string;
}

const BadgeIcons = ({ msg }: { msg: ChatMsg }) => (
    <div className="flex items-center gap-1 mr-1 flex-shrink-0">
        {msg.pay_grade_icon && <img src={msg.pay_grade_icon} alt="level" className="h-5 w-auto object-contain" />}
        {msg.fans_club_icon && <img src={msg.fans_club_icon} alt="fans" className="h-5 w-auto object-contain" />}
    </div>
);

const GenderIcon = ({ gender }: { gender?: number }) => {
    if (gender === 1) return <svg className="w-4 h-4.5 ml-0.25 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M10 14a4 4 0 100-8 4 4 0 000 8zm5-9l5-5m0 0h-5m5 0v5" /></svg>;
    if (gender === 2) return <svg className="w-4 h-4.5 ml-0.25 text-pink-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M12 11a4 4 0 100-8 4 4 0 000 8zm0 4v6m-3-3h6" /></svg>;
    return null;
};

export default function ChatList({ chats, loading, onLoadMore, jumpTime, highlightUid, goToProfile, formatTime }: ChatListProps) {
    const virtuosoRef = useRef<VirtuosoHandle>(null);
    const hasScrolledRef = useRef(false);

    // ✅ 处理高亮跳转
    useEffect(() => {
        if (highlightUid && chats.length > 0 && !hasScrolledRef.current) {
            const index = chats.findIndex(msg => 
                msg.sec_uid === highlightUid && 
                // ✅ 保持之前的优化：15秒时间窗口
                Math.abs(new Date(msg.created_at!).getTime() - new Date(jumpTime || 0).getTime()) < 15000
            );
            
            if (index !== -1) {
                // 找到消息，执行跳转
                setTimeout(() => {
                    virtuosoRef.current?.scrollToIndex({ index, align: 'center', behavior: 'smooth' });
                    hasScrolledRef.current = true;
                }, 500);
            }
        }
    }, [highlightUid, chats, jumpTime]);

    if (chats.length === 0) {
        return <div className="py-20 text-center text-xs text-gray-400">{loading ? "加载中..." : "暂无弹幕"}</div>;
    }

    return (
        <Virtuoso
            ref={virtuosoRef}
            style={{ height: '100%' }}
            data={chats}
            overscan={500}
            endReached={onLoadMore}
            components={{ Footer: () => (loading ? <div className="py-4 text-center text-xs text-gray-400">加载更多...</div> : null) }}
            itemContent={(index, msg) => {
                const isHighlighted = highlightUid && msg.sec_uid === highlightUid && 
                                      Math.abs(new Date(msg.created_at!).getTime() - new Date(jumpTime || 0).getTime()) < 15000;
                return (
                    <div className={`flex gap-2 md:gap-3 group hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 md:p-3 rounded-lg transition-colors border-b border-gray-50 dark:border-gray-800/50 ${isHighlighted ? 'bg-yellow-100 dark:bg-yellow-900/30 ring-2 ring-yellow-400' : ''}`}>
                        <div className="relative w-10 h-10 shrink-0 cursor-pointer" onClick={(e) => goToProfile(e, msg.sec_uid)}>
                            <img src={msg.avatar_url || '/default-avatar.png'} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-transparent hover:border-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center flex-wrap gap-y-1 mb-0.5">
                                <BadgeIcons msg={msg} />
                                <span className="text-xs md:text-sm font-bold text-gray-700 dark:text-gray-300 truncate cursor-pointer hover:text-blue-500 max-w-[120px]" onClick={(e) => goToProfile(e, msg.sec_uid)}>{msg.user_name}</span>
                                <GenderIcon gender={msg.gender} />
                                <span className="text-[10px] md:text-xs text-gray-300 ml-auto whitespace-nowrap pl-2">
                                        {formatTime(msg.event_time || msg.created_at)}
                                </span>
                            </div>
                            <div className="text-xs md:text-sm text-gray-800 dark:text-gray-200 break-words leading-relaxed">{msg.content}</div>
                        </div>
                    </div>
                );
            }}
        />
    );
}