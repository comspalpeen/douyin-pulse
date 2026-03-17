// src/components/AuthorCard.tsx
import React from 'react';
import Link from 'next/link';
import { Author } from '../types/author';

interface AuthorCardProps {
    author: Author;
}

const formatNumber = (num: number) => {
    if (num >= 10000) return (num / 10000).toFixed(1) + '万';
    return num.toString();
};

const AuthorCard: React.FC<AuthorCardProps> = ({ author }) => {
    const isLive = author.live_status === 1;
    const isLine = author.live_status === 2;
    const isOnline = isLive || isLine;

    // 强化开播与未开播的层级区分：未开播卡片变暗，开播卡片增加边缘发光
    const cardOpacity = isOnline ? 'opacity-100' : 'opacity-60 hover:opacity-100';
    const borderColor = isLive ? 'border-destructive shadow-[0_0_10px_rgba(var(--color-destructive),0.3)]' : isLine ? 'border-accent' : 'border-border hover:border-primary/50';
    const textColor = isLive ? 'text-destructive' : isLine ? 'text-accent' : 'text-muted-foreground';
    const statusText = isLive ? 'LIVE' : isLine ? 'LINKED' : 'OFFLINE';

    // 独立的头像点击事件：阻止卡片 Link 跳转，改为打开抖音主页
    const handleAvatarClick = (e: React.MouseEvent) => {
        e.preventDefault(); 
        window.open(`https://www.douyin.com/user/${author.sec_uid}`, '_blank');
    };

    return (
        <Link href={`/author/${author.sec_uid}`} className={`block relative group cursor-pointer outline-none transition-all duration-500 ${cardOpacity}`}>
            <div className={`relative bg-card p-4 border transition-all duration-500 ${borderColor} group-hover:bg-primary/5 overflow-hidden rounded-[var(--radius)]`}>
                
                {/* 战术准星：在粉红模式下自动隐藏 */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-current transition-all group-hover:w-4 group-hover:h-4 text-primary opacity-100 [.theme-pink_&]:opacity-0"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-current transition-all group-hover:w-4 group-hover:h-4 text-primary opacity-100 [.theme-pink_&]:opacity-0"></div>
                
                <div className="flex gap-4 items-center">
                    {/* 头像区域 */}
                    <div className="relative shrink-0">
                        <div 
                            onClick={handleAvatarClick}
                            className={`w-16 h-16 border-2 ${isLive ? 'border-destructive' : 'border-transparent'} p-0.5 bg-background rounded-[var(--radius)] overflow-hidden transition-all duration-300 hover:scale-110 z-10 relative shadow-sm`}
                            title="点击跳转抖音主页"
                        >
                            {/* 永远彩色，移除 grayscale */}
                            <img 
                                src={author.avatar || '/default-avatar.png'} 
                                alt={author.nickname}
                                className="w-full h-full object-cover rounded-[calc(var(--radius)-2px)]"
                            />
                        </div>
                        {/* 状态指示徽章 */}
                        <div className={`absolute -bottom-2 -right-3 px-2 py-0.5 border-2 border-card bg-background font-black text-[10px] tracking-wider rounded-full transition-colors duration-500 z-20 flex items-center shadow-sm ${textColor}`}>
                            {isLive && <span className="inline-block w-1.5 h-1.5 bg-destructive rounded-full mr-1 animate-ping"></span>}
                            {statusText}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-center h-16 pl-2">
    {/* 名字 (已移除 UID) */}
    <h3 className={`font-bold text-base truncate transition-colors ${isOnline ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'} uppercase [.theme-pink_&]:normal-case`}>
        {author.nickname}
    </h3>
    
    {/* 数据面板 - 统一设置基础字号为 11px (可根据需求调整) */}
    <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-[11px]">
        <div className="flex flex-col border-l-2 border-primary/30 pl-1.5 transition-colors">
            {/* 移除 scale-90 保证尺寸一致 */}
            <span className="text-muted-foreground origin-left">FOLLOWERS</span>
            <span className="text-foreground font-bold">{formatNumber(author.follower_count)}</span>
        </div>
        {/* 淡蓝色 (sky-500) 突出在线人数 */}
        <div className={`flex flex-col border-l-2 pl-1.5 transition-colors ${isOnline ? 'border-sky-400/50' : 'border-border'}`}>
            {/* 移除 scale-90 保证尺寸一致 */}
            <span className={`origin-left transition-colors ${isOnline ? 'text-sky-500' : 'text-muted-foreground'}`}>ON_SITE</span>
            {/* 统一字号为继承的 11px，仅保留颜色和字重差异 */}
            <span className={`transition-colors font-black ${isOnline ? 'text-sky-500' : 'text-muted-foreground'}`}>
                {isOnline ? formatNumber(author.user_count) : '---'}
            </span>
        </div>
    </div>
</div>
                </div>

                {/* 悬停扫描线 - 仅在战术模式显示 */}
                <div className="absolute left-0 top-0 w-full h-[1px] bg-primary/50 opacity-0 group-hover:opacity-100 group-hover:animate-[scanline_2s_linear_infinite] [.theme-pink_&]:hidden"></div>
            </div>
        </Link>
    );
};

export default AuthorCard;