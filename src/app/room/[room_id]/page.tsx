'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

// 1. 更新接口定义
interface ChatMsg {
  user_name: string;
  content: string;
  created_at: string;
  fans_club_level: number;
  avatar_url?: string;
  gender?: number;            // 1男 2女
  pay_grade_icon?: string;
  fans_club_icon?: string;
  sec_uid?: string;
}

interface GiftMsg {
  user_name: string;
  gift_name: string;
  total_diamond_count: number;
  combo_count: number;
  avatar_url?: string;
  created_at: string;
  gender?: number;
  pay_grade_icon?: string;
  fans_club_icon?: string;
  sec_uid?: string;
  gift_icon_url?: string;
}

interface PKRecord {
  battle_id: string;
  mode: string;
  start_time: string;
  teams: {
    team_id: string;
    win_status: number;
    anchors: {
      nickname: string;
      avatar: string;
      score: number;
    }[];
  }[];
}
// 2. 辅助组件：性别图标
const GenderBadge = ({ gender }: { gender?: number }) => {
  if (gender === 1) {
    // 男性图标 (蓝色)
    return (
      <span className="inline-flex items-center justify-center w-3.5 h-3.5 bg-blue-100 rounded-full mr-1 shrink-0">
        <svg className="w-2.5 h-2.5 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M19 13a1 1 0 10-2 0 1 1 0 00-2 0v-1.586l-2.707 2.707A6.974 6.974 0 0013 18a7 7 0 100-14 6.975 6.975 0 003.879.828l2.707-2.707H18a1 1 0 100-2h4a1 1 0 001-1v4zM9 16a5 5 0 110-10 5 5 0 010 10z"></path></svg>
      </span>
    );
  } else if (gender === 2) {
    // 女性图标 (粉色)
    return (
      <span className="inline-flex items-center justify-center w-3.5 h-3.5 bg-pink-100 rounded-full mr-1 shrink-0">
        <svg className="w-2.5 h-2.5 text-pink-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a7 7 0 100 14 7 7 0 000-14zm0 12a5 5 0 110-10 5 5 0 010 10zm0 3a1 1 0 011 1v2h2a1 1 0 110 2h-2v2a1 1 0 11-2 0v-2H9a1 1 0 110-2h2v-2a1 1 0 011-1z"></path></svg>
      </span>
    );
  }
  return null;
};

export default function RoomDetailPage() {
  const params = useParams();
  const room_id = params.room_id as string;

  const [activeTab, setActiveTab] = useState<'chat' | 'gift'>('chat');
  const [chats, setChats] = useState<ChatMsg[]>([]);
  const [gifts, setGifts] = useState<GiftMsg[]>([]);
  const [pks, setPks] = useState<PKRecord[]>([]);
  const [roomInfo, setRoomInfo] = useState<any>(null);

  useEffect(() => {
    if (!room_id) return;
    const fetchData = async () => {
      const API_BASE = 'http://139.196.142.3:8000/api/rooms';
      try {
        const [roomRes, chatRes, giftRes, pkRes] = await Promise.all([
            fetch(`${API_BASE}/${room_id}/detail`),
            fetch(`${API_BASE}/${room_id}/chats`),
            fetch(`${API_BASE}/${room_id}/gifts`),
            fetch(`${API_BASE}/${room_id}/pks`)
        ]);

        if (roomRes.ok) setRoomInfo(await roomRes.json());
        if (chatRes.ok) setChats(await chatRes.json());
        if (giftRes.ok) setGifts(await giftRes.json());
        if (pkRes.ok) setPks(await pkRes.json());
      } catch (e) {
        console.error("加载数据失败", e);
      }
    };
    fetchData();
  }, [room_id]);

  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString('zh-CN', { hour12: false });

  // 3. 通用跳转函数
  const goToUser = (e: React.MouseEvent, sec_uid?: string) => {
    e.stopPropagation();
    if (sec_uid) {
        window.open(`https://www.douyin.com/user/${sec_uid}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 p-4 h-screen flex flex-col">
      <header className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-4 flex justify-between items-center shrink-0">
         <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">
                {roomInfo?.title || '直播详情'}
            </h1>
            <p className="text-xs text-gray-500 mt-1">Room ID: {room_id}</p>
         </div>
         <div className="text-right">
             <div className="text-2xl font-bold text-blue-600">{roomInfo?.max_viewers || 0}</div>
             <div className="text-xs text-gray-400">最高在线</div>
         </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden">
        
        {/* 左侧：弹幕与礼物 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button 
                    onClick={() => setActiveTab('chat')}
                    className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'chat' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    💬 弹幕 ({chats.length})
                </button>
                <button 
                    onClick={() => setActiveTab('gift')}
                    className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'gift' ? 'text-pink-600 border-b-2 border-pink-600 bg-pink-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    🎁 礼物 ({gifts.length})
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {activeTab === 'chat' ? (
                    // --- 渲染弹幕 ---
                    chats.map((msg, i) => (
                        <div key={i} className="flex gap-3 group">
                            {/* 头像 */}
                            <div className="flex-shrink-0 cursor-pointer" onClick={(e) => goToUser(e, msg.sec_uid)}>
                                <img 
                                    src={msg.avatar_url || '/default-avatar.png'} 
                                    className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-600 object-cover" 
                                    alt="avatar" 
                                />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                {/* 用户名行：性别 + 徽章 + 名字 */}
                                <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                    <GenderBadge gender={msg.gender} />
                                    
                                    {/* 消费等级图标 */}
                                    {msg.pay_grade_icon && (
                                        <img src={msg.pay_grade_icon} className="h-4 w-auto object-contain" alt="lv" />
                                    )}

                                    {/* 粉丝团等级 */}
                                    {msg.fans_club_level > 0 && (
                                        <div className="flex items-center bg-gray-800 rounded px-1 h-4 relative overflow-hidden shrink-0" title={`粉丝团等级 ${msg.fans_club_level}`}>
                                            {msg.fans_club_icon && <img src={msg.fans_club_icon} className="h-3 w-3 mr-0.5 object-contain" alt="club" />}
                                            <span className="text-[10px] text-white font-bold leading-none">{msg.fans_club_level}</span>
                                        </div>
                                    )}

                                    {/* 可点击的用户名 */}
                                    <span 
                                        onClick={(e) => goToUser(e, msg.sec_uid)}
                                        className="text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer truncate"
                                    >
                                        {msg.user_name}
                                    </span>
                                    
                                    <span className="text-[10px] text-gray-300 ml-auto whitespace-nowrap">{formatTime(msg.created_at)}</span>
                                </div>
                                
                                {/* 弹幕内容 */}
                                <div className="text-sm text-gray-800 dark:text-gray-100 break-all leading-relaxed bg-gray-50 dark:bg-gray-700/50 p-2 rounded-r-lg rounded-bl-lg inline-block">
                                    {msg.content}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    // --- 渲染礼物 ---
                    gifts.map((gift, i) => (
                        <div key={i} className="flex gap-3 relative overflow-hidden bg-pink-50/30 dark:bg-pink-900/10 p-2 rounded-lg border border-pink-100 dark:border-pink-900/30">
                            {/* 头像 */}
                            <div className="flex-shrink-0 cursor-pointer" onClick={(e) => goToUser(e, gift.sec_uid)}>
                                <img 
                                    src={gift.avatar_url || '/default-avatar.png'} 
                                    className="w-10 h-10 rounded-full border-2 border-pink-200 dark:border-pink-800 object-cover" 
                                    alt="avatar"
                                />
                            </div>

                            <div className="flex-1 z-10 min-w-0">
                                {/* 用户名行 */}
                                <div className="flex items-center gap-1.5 mb-1">
                                    <GenderBadge gender={gift.gender} />
                                    {gift.pay_grade_icon && <img src={gift.pay_grade_icon} className="h-4 w-auto object-contain" alt="lv" />}
                                    <span 
                                        onClick={(e) => goToUser(e, gift.sec_uid)}
                                        className="text-sm font-bold text-gray-700 dark:text-gray-200 hover:text-pink-600 cursor-pointer truncate"
                                    >
                                        {gift.user_name}
                                    </span>
                                    <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">{formatTime(gift.created_at)}</span>
                                </div>

                                {/* 礼物详情行 */}
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500 shrink-0">送出</span>
                                    <span className="text-sm font-bold text-pink-600 truncate">{gift.gift_name}</span>
                                    
                                    {/* 礼物图标 */}
                                    {gift.gift_icon_url && (
                                        <img src={gift.gift_icon_url} className="w-8 h-8 object-contain animate-bounce-short shrink-0" alt="gift" />
                                    )}

                                    <div className="flex flex-col ml-auto text-right shrink-0">
                                        <span className="text-lg font-black text-pink-500 italic">x{gift.combo_count}</span>
                                        <span className="text-[10px] text-gray-400">💎{gift.total_diamond_count}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* 右侧：PK 历史记录 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                <h3 className="font-bold text-gray-700 dark:text-gray-200">⚔️ PK 对战记录 ({pks.length})</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {pks.map((pk, i) => (
                    <div key={i} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-gray-50/50 dark:bg-gray-800">
                        <div className="flex justify-between text-xs text-gray-400 mb-2">
                            <span>🕒 {new Date(pk.start_time).toLocaleString()}</span>
                            <span className="uppercase px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-gray-600 dark:text-gray-300">
                                {pk.mode}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            {pk.teams.map((team, tIdx) => (
                                <div key={tIdx} className={`flex-1 flex flex-col items-center p-2 rounded ${
                                    team.win_status === 1 ? 'bg-red-50 dark:bg-red-900/20 border border-red-100' : 
                                    team.win_status === 2 ? 'bg-gray-100 dark:bg-gray-700 opacity-80' : ''
                                }`}>
                                    <div className="flex -space-x-2 mb-1">
                                        {team.anchors.map((anchor, aIdx) => (
                                             <img key={aIdx} src={anchor.avatar} className="w-8 h-8 rounded-full border-2 border-white object-cover" title={anchor.nickname} alt={anchor.nickname} />
                                        ))}
                                    </div>
                                    <div className="font-bold text-lg text-gray-800 dark:text-gray-200">
                                        {team.anchors.reduce((acc, curr) => acc + curr.score, 0).toLocaleString()}
                                    </div>
                                    {team.win_status === 1 && <span className="text-xs text-red-500 font-bold">WIN</span>}
                                </div>
                            ))}
                            {pk.teams.length === 2 && (
                                <div className="font-black text-gray-300 italic text-xl">VS</div>
                            )}
                        </div>
                    </div>
                ))}
                {pks.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <div className="text-4xl mb-2">🏳️</div>
                        <p>本场直播无 PK 记录</p>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}