'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RoomDetail, SearchTarget } from '@/types/room';

interface RoomHeaderProps {
    roomInfo: RoomDetail | null | undefined;
    searchState: any; 
    actions: any;
    onOpenStats: () => void;
}

export default function RoomHeader({ roomInfo, searchState, actions, onOpenStats }: RoomHeaderProps) {
    const router = useRouter();
    const { 
        searchTarget, setSearchTarget, 
        inputSearch, setInputSearch, appliedSearch,
        minPriceInput, setMinPriceInput,
        enableMinPrice, setEnableMinPrice,
        // ✅ 仅保留需要的状态
        filterGender, setFilterGender,
        filterMinPayGrade, setFilterMinPayGrade,
        filterMinFansLevel, setFilterMinFansLevel
    } = searchState;

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

    // 点击外部关闭筛选面板
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isLive = roomInfo?.live_status === 1;
    const headerStatLabel = isLive ? "当前在线" : "平均在线";
    const headerStatValue = roomInfo?.user_count || 0; 

    // ✅ 计算是否有激活的筛选条件 (移除时间)
    const hasActiveFilters = filterGender !== null || filterMinPayGrade > 0 || filterMinFansLevel > 0;

    return (
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-3 shadow-sm z-10 shrink-0 relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Left: Info */}
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="text-xl hover:bg-gray-100 p-1 rounded dark:text-white dark:hover:bg-gray-800">←</button>
                    <div className="flex flex-col cursor-pointer group p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" onClick={onOpenStats}>
                        <div className="flex items-center gap-2">
                            <h1 className="font-bold text-gray-900 dark:text-white truncate max-w-[150px] text-sm md:text-lg group-hover:text-blue-600 transition-colors">
                                {roomInfo?.nickname || '加载中...'}
                            </h1>
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <span className={`text-[10px] flex items-center gap-1 ${isLive ? 'text-green-500' : 'text-blue-500'}`}>
                            {isLive && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>}
                            {headerStatLabel}: <span className="font-bold">{headerStatValue.toLocaleString()}</span>
                        </span>
                    </div>
                </div>

                {/* Right: Search & Filters */}
                <div className="flex flex-wrap items-center gap-2 flex-1 md:justify-end">
                    {/* 搜索组合 */}
                    <div className="flex gap-0 w-full md:w-auto items-stretch h-[32px] md:h-[38px] shadow-sm rounded-lg">
                        <select value={searchTarget} onChange={(e) => setSearchTarget(e.target.value as SearchTarget)} className="bg-gray-100 border border-gray-300 border-r-0 text-gray-900 text-xs md:text-sm rounded-l-lg block p-1 md:p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none">
                            <option value="all">全部</option>
                            <option value="chat">弹幕</option>
                            <option value="gift">礼物</option>
                        </select>
                        <div className="relative flex-1 md:w-48">
                            <input type="text" className="block w-full h-full p-1 md:p-2 pr-7 text-xs md:text-sm text-gray-900 border border-gray-300 border-l-0 border-r-0 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none" placeholder="关键词..." value={inputSearch} onChange={(e) => setInputSearch(e.target.value)} onKeyDown={actions.handleKeyDown} />
                            {inputSearch && <button onClick={() => setInputSearch('')} className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>}
                        </div>
                        <button onClick={actions.handleSearch} className="px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm font-medium border border-blue-600 dark:border-blue-700">搜索</button>
                        
                        {/* 筛选按钮 */}
                        <button 
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`px-3 border border-l-0 flex items-center justify-center transition-colors ${
                                hasActiveFilters || isFilterOpen
                                ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400' 
                                : 'bg-gray-100 border-gray-300 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                            } ${appliedSearch ? '' : 'rounded-r-lg'}`} 
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
                        </button>

                        <button 
                            onClick={actions.handleReset} 
                            disabled={!appliedSearch && !hasActiveFilters} 
                            className={`px-3 text-white text-xs md:text-sm font-medium rounded-r-lg border border-l-0 ${
                                appliedSearch || hasActiveFilters
                                ? 'bg-gray-500 hover:bg-gray-600 border-gray-500 dark:border-gray-600 cursor-pointer' 
                                : 'bg-gray-200 border-gray-200 dark:bg-gray-800 dark:border-gray-700 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            重置
                        </button>
                    </div>

                    {/* 钻石快捷筛选 */}
                    <div className={`flex items-center rounded-lg px-2 border h-[32px] md:h-[38px] transition-colors ${enableMinPrice ? 'bg-pink-50 border-pink-200 dark:bg-pink-900/20 dark:border-pink-800' : 'bg-gray-100 border-gray-200 dark:bg-gray-800 dark:border-gray-700'}`}>
                        <input type="checkbox" checked={enableMinPrice} onChange={(e) => setEnableMinPrice(e.target.checked)} className="mr-1" />
                        <span className="text-xs mr-1 text-pink-500">💎 &gt;</span>
                        <input type="number" className="w-10 bg-transparent text-xs outline-none font-bold text-pink-600" value={minPriceInput} onChange={(e) => setMinPriceInput(Number(e.target.value))} />
                    </div>
                </div>
            </div>

            {/* 高级筛选面板 (Dropdown) */}
            {isFilterOpen && (
                <div ref={filterRef} className="absolute top-full right-2 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 flex justify-between items-center">
                        高级筛选条件
                        <span className="text-xs font-normal text-blue-500 cursor-pointer" onClick={actions.handleReset}>清空全部</span>
                    </h3>
                    
                    <div className="space-y-4">
                        {/* 1. 性别 */}
                        <div>
                            <label className="text-xs text-gray-500 block mb-1.5">性别</label>
                            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                {[
                                    { val: null, label: '全部' },
                                    { val: 1, label: '♂ 男' },
                                    { val: 2, label: '♀ 女' }
                                ].map((opt) => (
                                    <button
                                        key={String(opt.val)}
                                        onClick={() => setFilterGender(opt.val)}
                                        className={`flex-1 py-1.5 text-xs rounded-md transition-all ${
                                            filterGender === opt.val 
                                            ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 font-bold' 
                                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 2. 等级筛选 */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">最低消费等级</label>
                                <div className="flex items-center border rounded-lg px-2 bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                                    <span className="text-xs text-orange-500 font-bold mr-1">Lv</span>
                                    <input 
                                        type="number" 
                                        className="w-full bg-transparent text-sm py-1.5 outline-none" 
                                        placeholder="0"
                                        value={filterMinPayGrade || ''}
                                        onChange={(e) => setFilterMinPayGrade(Number(e.target.value))}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">最低粉丝团</label>
                                <div className="flex items-center border rounded-lg px-2 bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                                    <span className="text-xs text-blue-500 font-bold mr-1">❤️</span>
                                    <input 
                                        type="number" 
                                        className="w-full bg-transparent text-sm py-1.5 outline-none" 
                                        placeholder="0"
                                        value={filterMinFansLevel || ''}
                                        onChange={(e) => setFilterMinFansLevel(Number(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}