import React from 'react';
import { PkBattle, PkTeam, PkAnchor, PkContributor } from '@/types/room';

interface PkCardProps {
    pk: PkBattle;
}

const PkCard: React.FC<PkCardProps> = ({ pk }) => {
    const formatTime = (t: string) => new Date(t).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

    // --- 核心逻辑：点击头像跳转 ---
    const handleAvatarClick = async (e: React.MouseEvent, uid: string) => {
        e.stopPropagation();
        e.preventDefault();
        
        const target = e.currentTarget as HTMLImageElement | HTMLSpanElement;
        target.style.cursor = 'wait';
        target.style.opacity = '0.7';

        try {
            const res = await fetch(`/api/lookup_user/${uid}`);
            const data = await res.json();
            
            if (data.sec_uid) {
                window.open(`https://www.douyin.com/user/${data.sec_uid}`, '_blank');
            } else {
                alert("未查询到该用户主页信息");
            }
        } catch (error) {
            console.error("跳转失败", error);
        } finally {
            target.style.cursor = 'pointer';
            target.style.opacity = '1';
        }
    };

    // 逻辑判定
    const totalAnchorsCount = pk.teams.reduce((acc, t) => acc + t.anchors.length, 0);
    const isRankMode = pk.teams.length > 2 || pk.mode === 'rank';
    const isTeamVsMode = pk.teams.length === 2 && totalAnchorsCount > 2;

    // --- 辅助：渲染贡献榜列表 (竖排) ---
    const renderContributorList = (list: PkContributor[]) => {
        if (!list || list.length === 0) return <div className="text-[10px] text-gray-300 mt-1 text-center py-1">暂无贡献</div>;
        
        return (
            <div className="flex flex-col gap-1 mt-1 w-full px-1 max-h-24 overflow-y-auto custom-scrollbar">
                {list.map((c, i) => (
                    <div 
                        key={i} 
                        className="flex items-center justify-between text-xs bg-gray-50 dark:bg-black/20 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group"
                        onClick={(e) => handleAvatarClick(e, c.user_id)}
                    >
                        <div className="flex items-center gap-1.5 min-w-0">
                            {/* 头像 + 排名 */}
                            <div className="relative flex-shrink-0">
                                <img src={c.avatar || '/default-avatar.png'} className="w-4 h-4 rounded-full object-cover" />
                                {i < 3 && (
                                    <span className={`absolute -top-1 -right-1 text-[6px] flex justify-center items-center w-2.5 h-2.5 rounded-full text-white scale-90 ${
                                        i===0 ? 'bg-yellow-500' : i===1 ? 'bg-gray-400' : 'bg-orange-600'
                                    }`}>
                                        {i+1}
                                    </span>
                                )}
                            </div>
                            {/* 昵称 */}
                            <span className="truncate max-w-[50px] md:max-w-[70px] text-gray-600 dark:text-gray-300 group-hover:text-blue-500 scale-90 origin-left">
                                {c.nickname}
                            </span>
                        </div>
                        {/* 分数 */}
                        <span className="font-mono font-bold text-pink-500 text-[10px] scale-90 origin-right">{c.score}</span>
                    </div>
                ))}
            </div>
        );
    };

    // --- 场景 A: 多人混战排名 (Rank List) ---
    if (isRankMode) {
        const allAnchors = pk.teams.flatMap(t => t.anchors);
        const sortedAnchors = allAnchors.sort((a, b) => b.score - a.score);

        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4 shadow-sm">
                <div className="flex justify-between items-center mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">
                    <span className="text-xs text-gray-400">🕒 {formatTime(pk.start_time)}</span>
                    <span className="text-xs font-bold bg-purple-100 text-purple-600 px-2 py-0.5 rounded">
                        👑 多人排名赛 ({sortedAnchors.length}人)
                    </span>
                </div>
                <div className="space-y-4">
                    {sortedAnchors.map((anchor, idx) => {
                        const rankColor = idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-orange-500' : 'text-gray-500';
                        const isWinner = idx === 0;
                        return (
                            <div key={anchor.user_id} className="flex flex-col md:flex-row items-start md:items-center p-3 rounded-lg border border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
                                <div className="flex items-center w-full md:w-40 flex-shrink-0 mb-2 md:mb-0">
                                    <span className={`w-6 font-black italic text-lg ${rankColor} text-center mr-2`}>{idx + 1}</span>
                                    <div className="relative mr-3 flex-shrink-0">
                                        <img 
                                            src={anchor.avatar || '/default-avatar.png'} 
                                            className="w-10 h-10 rounded-full bg-gray-200 object-cover cursor-pointer border-2 border-transparent hover:border-blue-400" 
                                            onClick={(e) => handleAvatarClick(e, anchor.user_id)}
                                        />
                                        {isWinner && <span className="absolute -top-2 -left-1 text-sm animate-bounce">👑</span>}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate max-w-[100px] cursor-pointer hover:text-blue-500" onClick={(e) => handleAvatarClick(e, anchor.user_id)}>
                                            {anchor.nickname}
                                        </span>
                                        <div className="text-xs font-black text-gray-500">{anchor.score.toLocaleString()} 分</div>
                                    </div>
                                </div>
                                <div className="flex-1 w-full border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700 pt-2 md:pt-0 md:pl-4">
                                    <div className="text-[10px] text-gray-400 mb-1">🔥 贡献榜</div>
                                    {renderContributorList(anchor.contributors)}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        );
    }

    // --- 场景 B: 对抗模式 (1v1 或 2v2) ---
    const teamA = pk.teams[0];
    const teamB = pk.teams[1] || { anchors: [], win_status: 0, team_id: '0' };

    const scoreA = teamA.anchors.reduce((acc, cur) => acc + cur.score, 0);
    const scoreB = teamB?.anchors.reduce((acc: number, cur) => acc + cur.score, 0) || 0;
    const totalScore = scoreA + scoreB || 1;
    const percentA = Math.round((scoreA / totalScore) * 100);

    const getIsWin = (currentTeam: PkTeam, currentScore: number, opponentTeam: PkTeam, opponentScore: number) => {
        if (currentTeam.win_status === 1) return true;
        if (currentTeam.win_status === 2) return false;
        if (currentTeam.win_status === 0 && opponentTeam.win_status === 0) return currentScore > opponentScore;
        return false;
    };

    const isTeamAWin = getIsWin(teamA, scoreA, teamB, scoreB);
    const isTeamBWin = getIsWin(teamB, scoreB, teamA, scoreA);

    // ✅ 渲染对抗的一方 (核心修改：支持主播分离展示)
    const renderVsSide = (team: PkTeam, color: 'red' | 'blue', isWinner: boolean) => {
        const borderColor = color === 'red' ? 'border-red-500' : 'border-blue-500';
        const textColor = color === 'red' ? 'text-red-500' : 'text-blue-500';
        const bgTint = color === 'red' ? 'bg-red-50 dark:bg-red-900/10' : 'bg-blue-50 dark:bg-blue-900/10';

        return (
            <div className={`flex-1 flex flex-col items-center rounded-xl p-2 ${bgTint}`}>
                {/* 队伍总分 & 胜负标识 */}
                <div className="flex flex-col items-center mb-3 relative w-full border-b border-black/5 dark:border-white/5 pb-2">
                    {isWinner && (
                        <div className="absolute -top-6 text-3xl transform -rotate-12 filter drop-shadow-md z-20 animate-pulse">👑</div>
                    )}
                    <span className={`text-xl font-black ${textColor} tabular-nums`}>
                        {team.anchors.reduce((acc, cur) => acc + cur.score, 0).toLocaleString()}
                    </span>
                    {isWinner && <span className={`text-[10px] font-bold px-2 rounded-full text-white ${color === 'red' ? 'bg-red-500' : 'bg-blue-500'}`}>WIN</span>}
                </div>

                {/* ✅ 遍历主播列表：每个主播独立展示 */}
                <div className="w-full space-y-3">
                    {team.anchors.map((anchor) => (
                        <div key={anchor.user_id} className="flex flex-col w-full bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
                            {/* 主播头部信息 */}
                            <div className="flex items-center gap-2 mb-2 border-b border-dashed border-gray-200 dark:border-gray-700 pb-2">
                                <img 
                                    src={anchor.avatar || '/default-avatar.png'} 
                                    className={`w-8 h-8 rounded-full border ${borderColor} p-0.5 object-cover cursor-pointer`}
                                    onClick={(e) => handleAvatarClick(e, anchor.user_id)}
                                    title={anchor.nickname}
                                />
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span 
                                        className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate cursor-pointer hover:text-blue-500"
                                        onClick={(e) => handleAvatarClick(e, anchor.user_id)}
                                    >
                                        {anchor.nickname}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-mono">
                                        {anchor.score.toLocaleString()} 分
                                    </span>
                                </div>
                            </div>

                            {/* ✅ 独立贡献榜 */}
                            {renderContributorList(anchor.contributors)}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between text-xs text-gray-400 mb-3">
                <span>🕒 {formatTime(pk.start_time)}</span>
                <span className="uppercase tracking-wider font-medium bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-[10px]">
                    {isTeamVsMode ? `⚔️ 团战 PK` : '⚔️ 1V1 对决'}
                </span>
            </div>

            {/* 主对抗区 */}
            <div className="flex items-start justify-between gap-2">
                {renderVsSide(teamA, 'red', isTeamAWin)}

                {/* VS 条 */}
                <div className="flex-shrink-0 flex flex-col items-center w-12 pt-4">
                    <span className="text-xl font-black italic text-gray-300 dark:text-gray-600 mb-1 select-none">VS</span>
                    {/* 竖向进度条 (在窄屏下可能更好，这里保持横向但缩短) */}
                </div>

                {renderVsSide(teamB, 'blue', isTeamBWin)}
            </div>
            
            {/* 底部总进度条 */}
            <div className="mt-4 w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex ring-1 ring-black/5 dark:ring-white/5">
                <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${percentA}%` }}></div>
                <div className="h-full bg-blue-500 transition-all duration-500 flex-1"></div>
            </div>
        </div>
    );
};

export default PkCard;