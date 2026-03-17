'use client';

import { useState, useEffect } from 'react';
import { SearchHeader } from "@/components/check/SearchHeader";
import { UserProfileCard } from "@/components/check/UserProfileCard";
import { RoomRelationCard } from "@/components/check/RoomRelationCard";
import { FavoritesSection } from "@/components/check/FavoritesSection";
import { AlertCircle } from "lucide-react";

export default function CheckPage() {
  // 1. 核心状态：主查询
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // 2. 核心状态：收藏夹数据 (由顶层获取，传给子组件)
  const [favorites, setFavorites] = useState<any[]>([]);

  const fetchFavorites = async () => {
    try {
      const res = await fetch('/api/favorites');
      if (res.ok) setFavorites(await res.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchFavorites(); }, []);

  const onSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null); 
    try {
      const res = await fetch(`/api/check/user?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResult(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    // 🚀 修改点 1：移除固定背景色 bg-[#020617] 和 text-slate-100
    // 使用全局变量 bg-background 和 text-foreground 让页面背景自动跟随主题切换
    <div className="min-h-screen bg-background text-foreground p-6 md:p-24 flex flex-col items-center font-sans pb-32 transition-colors duration-500">
      <div className="w-full max-w-4xl space-y-8">
        
        {/* 1. 搜索头 */}
        <SearchHeader 
          query={query} 
          setQuery={setQuery} 
          onSearch={onSearch} 
          loading={loading} 
        />

        {/* 错误提示 */}
        {result?.error && (
          // 🚀 修改点 2：将写死的红色替换为基于全局 --destructive 变量的颜色
          // 使用动态圆角 rounded-[var(--radius)] 适配战术(直角)与粉红(圆角)模式
          <div className="p-4 bg-destructive/10 border border-destructive/50 rounded-[var(--radius)] text-destructive text-center flex items-center justify-center gap-2 transition-all duration-500">
             <AlertCircle className="w-5 h-5"/> {result.error}
          </div>
        )}

        {/* 成功结果 */}
        {result && !result.error && (
          <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-700">
            
            {/* 2. 用户画像 */}
            <UserProfileCard result={result} />

            {/* 3. 单次透视 + 收藏 */}
            <RoomRelationCard 
                userSecUid={result.sec_uid} 
                onRefreshFavorites={fetchFavorites} 
            />

            {/* 4. 批量检测收纳仓 */}
            <FavoritesSection 
                userSecUid={result.sec_uid} 
                favorites={favorites}
                onRefreshFavorites={fetchFavorites}
            />
            
          </div>
        )}
      </div>
    </div>
  );
}