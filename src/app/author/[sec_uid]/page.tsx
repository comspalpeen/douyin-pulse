// page.tsx (AuthorDetailPage)
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation'; // 引入 useRouter

// ... (接口定义保持不变)
interface Room {
    room_id: string;
    title: string;
    cover_url?: string;
    created_at: string;
    end_time?: string;
    max_viewers: number;
    like_count: number;
    live_status: number;
}

export default function AuthorDetailPage() {
  const params = useParams();
  const router = useRouter(); // 初始化路由
  const sec_uid = params.sec_uid as string;

  // ... (状态和 useEffect 保持不变)
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ... (保持原有的 fetchRooms 逻辑)
    if (!sec_uid) return;
    const fetchRooms = async () => {
      try {
        const res = await fetch(`http://139.196.142.3:8000/api/authors/${sec_uid}/rooms`);
        if (res.ok) {
          const data = await res.json();
          setRooms(data);
        }
      } catch (error) {
        console.error('Fetch rooms error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, [sec_uid]);
  
  // ... (formatDate, getDuration 辅助函数保持不变)
  const formatDate = (dateString?: string) => {
    if (!dateString) return '未知时间';
    return new Date(dateString).toLocaleString('zh-CN', {
      month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

  const getDuration = (start: string, end?: string) => {
      if (!end) return '进行中...';
      const s = new Date(start).getTime();
      const e = new Date(end).getTime();
      const diffMin = Math.floor((e - s) / 1000 / 60);
      const hours = Math.floor(diffMin / 60);
      const mins = diffMin % 60;
      return `${hours}小时${mins}分`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          直播记录回放
        </h1>
        
        {/* ... (Loading 和 Empty 状态保持不变) */}
        {loading ? (
          <div className="text-gray-500">加载记录中...</div>
        ) : rooms.length === 0 ? (
          <div className="text-gray-500">暂无直播记录</div>
        ) : (
          <div className="space-y-4">
            {rooms.map((room) => (
              <div 
                key={room.room_id} 
                // ✅ 修改点：添加点击事件和 hover 样式
                onClick={() => router.push(`/room/${room.room_id}`)}
                className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex gap-4 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
              >
                {/* ... (卡片内部内容保持不变) */}
                <div className="w-32 h-20 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                    {room.cover_url ? (
                        <img src={room.cover_url} alt="cover" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">无封面</div>
                    )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate">
                      {room.title || '无标题直播'}
                    </h3>
                    <div className="text-xs text-gray-500 mt-1 flex gap-3">
                      <span>📅 {formatDate(room.created_at)}</span>
                      <span>⏳ {getDuration(room.created_at, room.end_time)}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 mt-2 text-sm font-medium">
                     <span className="text-blue-500 bg-blue-50 px-2 py-0.5 rounded">
                        👀 峰值: {room.max_viewers.toLocaleString()}
                     </span>
                     <span className="text-pink-500 bg-pink-50 px-2 py-0.5 rounded">
                        ❤️ 点赞: {(room.like_count / 10000).toFixed(1)}w
                     </span>
                     {room.live_status === 1 && (
                         <span className="text-red-500 border border-red-500 px-2 py-0.5 rounded text-xs animate-pulse">
                             直播中
                         </span>
                     )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}