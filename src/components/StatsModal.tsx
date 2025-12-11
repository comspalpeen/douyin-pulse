// src/components/StatsModal.tsx
import React from 'react';
import { RoomDetail } from '@/types/room';

interface StatsModalProps {
    room: RoomDetail | null;
    isOpen: boolean;
    onClose: () => void;
}

const StatsModal: React.FC<StatsModalProps> = ({ room, isOpen, onClose }) => {
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

    // 4. 数字格式化
    const formatStat = (num?: number) => {
        if (!num) return '0';
        if (num < 10000) return num.toLocaleString();
        return (num / 10000).toFixed(1) + '万';
    };

    const primaryStatLabel = isLive ? "当前在线" : "平均在线";
    const primaryStatValue = isLive ? room.user_count : getAvgOnline();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                
                {/* 标题栏 */}
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

                    {/* ✅ 第二行：钻石营收 (通栏大卡片) */}
                    <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-xl flex justify-between items-center border border-rose-100 dark:border-rose-800">
                        <div>
                            <div className="text-xs text-rose-600 dark:text-rose-400 mb-1 uppercase tracking-wider font-bold">本场钻石营收</div>
                            <div className="text-3xl font-black text-rose-600 dark:text-rose-400 tabular-nums tracking-tight">
                                {formatStat(room.total_diamond_count)}
                            </div>
                        </div>
                        <div className="text-right opacity-80 text-2xl">💎</div>
                    </div>

                    {/* 第三行：累计互动 */}
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
                    
                    <div className="col-span-2 text-xs text-gray-400 text-center mt-2">
                        开播时间: {new Date(room.created_at).toLocaleString()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatsModal;