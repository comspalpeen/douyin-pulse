'use client';
import ChatList from './ChatList';
import GiftList from './GiftList';
import PkList from './PkList';

interface DesktopRoomViewProps {
    data: any; 
    tab: 'chat' | 'pk';
    setTab: (t: 'chat' | 'pk') => void;
    jumpTime: string | null;
    highlightUid: string | null;
    goToProfile: (e: React.MouseEvent, uid?: string) => void;
    formatTime: (t?: string) => string;
    onReturnToLatest: () => void; // ✅ 新增 Prop 定义
}

export default function DesktopRoomView({ 
    data, tab, setTab, jumpTime, highlightUid, goToProfile, formatTime, onReturnToLatest 
}: DesktopRoomViewProps) {
    return (
        <main className="hidden md:grid flex-1 max-w-7xl w-full mx-auto p-4 grid-cols-3 gap-4 overflow-hidden">
            <div className="col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
                <div className="flex border-b border-gray-100 dark:border-gray-800 shrink-0">
                    <button onClick={() => setTab('chat')} className={`flex-1 py-3 text-sm font-bold transition-colors ${tab === 'chat' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/20' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>💬 实时弹幕</button>
                    <button onClick={() => setTab('pk')} className={`flex-1 py-3 text-sm font-bold transition-colors ${tab === 'pk' ? 'text-red-600 border-b-2 border-red-600 bg-red-50/50 dark:bg-red-900/20' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>⚔️ PK 战绩</button>
                </div>
                <div className="flex-1 overflow-hidden relative min-h-0">
                    {tab === 'chat' && (
                        <div className="absolute inset-0 flex flex-col">
                            <div className="p-3 border-b bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center h-[50px] shrink-0 z-10">
                                <span className="font-bold text-base">{jumpTime ? "🕰️ 历史回放" : "💬 实时弹幕"}</span>
                                {/* ✅ 修复：按钮逻辑 */}
                                {jumpTime ? (
                                    <button onClick={onReturnToLatest} className="text-xs bg-blue-100 text-blue-600 px-3 py-1.5 rounded-full hover:bg-blue-200 transition-colors">
                                        返回最新
                                    </button>
                                ) : (
                                    data.loadingChats && <span className="text-xs text-blue-500 animate-pulse">刷新...</span>
                                )}
                            </div>
                            <div className="flex-1 min-h-0">
                                <ChatList chats={data.chats} loading={data.loadingChats} onLoadMore={data.loadOldChats} jumpTime={jumpTime} highlightUid={highlightUid} goToProfile={goToProfile} formatTime={formatTime} />
                            </div>
                        </div>
                    )}
                    {tab === 'pk' && <PkList pks={data.pks} loading={data.loadingPks} />}
                </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-hidden relative min-h-0 flex flex-col">
                    <div className="p-3 border-b bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center h-[50px] shrink-0 z-10">
                        <span className="font-bold text-base">🎁 礼物</span>
                        <div className="flex gap-2 items-center">{data.loadingGifts && <span className="text-xs text-pink-500 animate-pulse">刷新...</span>}</div>
                    </div>
                    <div className="flex-1 min-h-0 bg-gray-50/30 dark:bg-black/20">
                        <GiftList gifts={data.gifts} loading={data.loadingGifts} onLoadMore={data.loadOldGifts} goToProfile={goToProfile} formatTime={formatTime} />
                    </div>
                </div>
            </div>
        </main>
    );
}