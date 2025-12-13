'use client';

import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import ChatList from './ChatList';
import GiftList from './GiftList';
import PkList from './PkList';

interface MobileRoomViewProps {
    data: any; 
    tab: 'chat' | 'gift' | 'pk';
    setTab: (t: 'chat' | 'gift' | 'pk') => void;
    jumpTime: string | null;
    highlightUid: string | null;
    goToProfile: (e: React.MouseEvent, uid?: string) => void;
    formatTime: (t?: string) => string;
    onReturnToLatest: () => void; // ✅ 新增 Prop 定义
}

export default function MobileRoomView({ 
    data, tab, setTab, jumpTime, highlightUid, goToProfile, formatTime, onReturnToLatest 
}: MobileRoomViewProps) {
    const { handleTouchStart, handleTouchEnd } = useSwipeGesture(tab, setTab);

    return (
        <div 
            className="md:hidden flex-1 flex flex-col overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <div className="flex border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-10 shrink-0">
                <button onClick={() => setTab('chat')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${tab === 'chat' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}>💬 弹幕</button>
                <button onClick={() => setTab('gift')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${tab === 'gift' ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500'}`}>🎁 礼物</button>
                <button onClick={() => setTab('pk')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${tab === 'pk' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500'}`}>⚔️ PK</button>
            </div>
            
            <div className="flex-1 relative bg-white dark:bg-gray-900 min-h-0">
                {tab === 'chat' && (
                    <div className="absolute inset-0 flex flex-col">
                        <div className="p-3 border-b bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center h-[40px] shrink-0 z-10">
                            <span className="font-bold text-sm">{jumpTime ? "🕰️ 回放" : "💬 实时"}</span>
                            {/* ✅ 修复：按钮逻辑 */}
                            {jumpTime ? (
                                <button onClick={onReturnToLatest} className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200 transition-colors">
                                    返回最新
                                </button>
                            ) : (
                                data.loadingChats && <span className="text-xs text-blue-500 animate-pulse">刷新...</span>
                            )}
                        </div>
                        <div className="flex-1 min-h-0">
                            <ChatList 
                                chats={data.chats} 
                                loading={data.loadingChats} 
                                onLoadMore={data.loadOldChats} 
                                jumpTime={jumpTime} 
                                highlightUid={highlightUid} 
                                goToProfile={goToProfile} 
                                formatTime={formatTime} 
                            />
                        </div>
                    </div>
                )}
                {tab === 'gift' && (
                    <div className="absolute inset-0 flex flex-col">
                        <div className="p-3 border-b bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center h-[40px] shrink-0 z-10">
                            <span className="font-bold text-sm">🎁 礼物</span>
                            {data.loadingGifts && <span className="text-xs text-pink-500 animate-pulse">刷新...</span>}
                        </div>
                        <div className="flex-1 min-h-0 bg-gray-50/30 dark:bg-black/20">
                            <GiftList gifts={data.gifts} loading={data.loadingGifts} onLoadMore={data.loadOldGifts} goToProfile={goToProfile} formatTime={formatTime} />
                        </div>
                    </div>
                )}
                {tab === 'pk' && <PkList pks={data.pks} loading={data.loadingPks} />}
            </div>
        </div>
    );
}