import React from 'react';
import Link from 'next/link';
import { Author } from '../types/author';

interface AuthorCardProps {
  author: Author;
}

// 数字格式化工具 (12000 -> 1.2w)
const formatNumber = (num: number) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toString();
};

const AuthorCard: React.FC<AuthorCardProps> = ({ author }) => {
  const isLive = author.live_status === 1;
  const isLine = author.live_status === 2;
  const isOnline = isLive || isLine;

  // 1. 状态样式配置
  let statusColor = 'text-gray-400 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
  let avatarBorder = 'border-transparent';
  let cardBorder = 'border-transparent hover:border-gray-200 dark:hover:border-gray-700';
  let statusText = '未开播';
  let statusBadge = null;

  if (isLive) {
    statusColor = 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
    avatarBorder = 'border-red-500';
    cardBorder = 'border-red-500/30 shadow-red-100 dark:shadow-none';
    statusText = '直播中';
    statusBadge = <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>;
  } else if (isLine) {
    statusColor = 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400';
    avatarBorder = 'border-yellow-400';
    cardBorder = 'border-yellow-400/30';
    statusText = '连线中';
    statusBadge = <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-yellow-400 border-2 border-white rounded-full"></span>;
  }

  // 交互逻辑
  const goToLiveRoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOnline && author.web_rid) {
      window.open(`https://live.douyin.com/${author.web_rid}`, '_blank');
    }
  };

  const goToProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://www.douyin.com/user/${author.sec_uid}`, '_blank');
  };

  return (
    <div className={`group relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border ${cardBorder} overflow-hidden flex flex-col`}>
      
      {/* 顶部背景装饰条 */}
      <div className={`h-16 w-full ${isLive ? 'bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/10 dark:to-transparent' : 'bg-gray-50 dark:bg-gray-700/30'}`}></div>

      <div className="px-5 pb-5 -mt-10 flex-1 flex flex-col">
        {/* 1. 头像与状态区 */}
        <div className="flex justify-between items-end">
           <div 
              className={`relative cursor-pointer transition-transform active:scale-95 ${isOnline ? 'hover:scale-105' : ''}`}
              onClick={goToLiveRoom}
              title={isOnline ? "点击观看直播" : "未开播"}
           >
             <img 
               src={author.avatar || '/default-avatar.png'} 
               alt={author.nickname}
               className={`w-20 h-20 rounded-full object-cover border-[4px] bg-white dark:bg-gray-800 ${avatarBorder}`}
             />
             {statusBadge}
           </div>
           
           {/* 右侧状态胶囊 */}
           <div className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${statusColor}`}>
              {statusText}
           </div>
        </div>

        {/* 2. 信息主体 (点击进入详情页) */}
        <Link href={`/author/${author.sec_uid}`} className="block mt-3 flex-1 cursor-pointer">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate pr-2 group-hover:text-blue-600 transition-colors">
            {author.nickname}
          </h3>
          
          <p className="text-sm text-gray-400 mt-1 line-clamp-1 h-5">
            {author.signature || '暂无个性签名'}
          </p>

          {/* 3. 数据统计栅格 */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {/* 粉丝数 (常驻显示) */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
               <div className="text-[10px] text-gray-400 uppercase tracking-wider">粉丝 Fans</div>
               <div className="font-bold text-gray-700 dark:text-gray-200">
                 {formatNumber(author.follower_count)}
               </div>
            </div>

            {/* 在线人数 / 或者是占位 */}
            {isOnline ? (
               <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2 text-center">
                  <div className="text-[10px] text-red-400 uppercase tracking-wider">在线人数</div>
                  <div className="font-bold text-red-600 dark:text-red-400">
                    {formatNumber(author.user_count)}
                  </div>
               </div>
            ) : (
               <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center opacity-50">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider">状态</div>
                  <div className="text-xs font-medium text-gray-500 py-0.5">
                    休息中 💤
                  </div>
               </div>
            )}
          </div>
        </Link>
      </div>

      {/* 4. 底部通栏按钮 */}
      <div 
        onClick={goToProfile}
        className="border-t border-gray-100 dark:border-gray-700 py-3 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group/btn"
      >
        <span className="text-xs font-semibold text-gray-400 group-hover/btn:text-red-500 flex items-center justify-center gap-1">
           主页
           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
        </span>
      </div>

    </div>
  );
};

export default AuthorCard;