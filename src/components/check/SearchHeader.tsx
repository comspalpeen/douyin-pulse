'use client';

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchHeaderProps {
  query: string;
  setQuery: (val: string) => void;
  onSearch: () => void;
  loading: boolean;
}

export function SearchHeader({ query, setQuery, onSearch, loading }: SearchHeaderProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="text-center space-y-2">
        {/* 移除 text-white，改为 text-foreground */}
        <h1 className="text-3xl font-black tracking-tighter text-foreground transition-colors duration-500">DEEP CHECKER</h1>
        {/* 移除 text-blue-400，改为 text-primary */}
        <p className="text-primary text-xs tracking-widest uppercase font-bold transition-colors duration-500">独立用户画像查询系统</p>
      </header>

      {/* 移除 bg-slate-900 border-slate-700，改为 bg-card border-border */}
      <div className="flex gap-2 p-1 bg-card border border-border rounded-[var(--radius)] shadow-xl transition-colors duration-500">
        <Input 
          placeholder="粘贴链接或输入抖音号..." 
          /* 移除 text-white placeholder:text-slate-600，改为 text-foreground placeholder:text-muted-foreground */
          className="border-0 bg-transparent text-foreground h-12 text-lg focus-visible:ring-0 placeholder:text-muted-foreground transition-colors duration-500"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
        />
        {/* 移除 bg-blue-600 hover:bg-blue-500，改为 bg-primary hover:bg-primary/80 text-primary-foreground */}
        <Button onClick={onSearch} disabled={loading} className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold px-8 transition-all h-12 rounded-[var(--radius)]">
          {loading ? "查询" : "分析"}
        </Button>
      </div>
    </div>
  );
}