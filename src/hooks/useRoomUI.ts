import { useState, useEffect } from 'react';
import { SearchTarget } from '@/types/room';

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export function useRoomUI() {
    // 基础搜索
    const [searchTarget, setSearchTarget] = useState<SearchTarget>('all');
    const [inputSearch, setInputSearch] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');
    
    // 价格筛选
    const [minPriceInput, setMinPriceInput] = useState(10);
    const [enableMinPrice, setEnableMinPrice] = useState(false);
    const debouncedMinPrice = useDebounce(minPriceInput, 500);

    // ✅ 高级筛选状态 (Raw: 用于绑定 Input 显示)
    const [filterGender, setFilterGender] = useState<number | null>(null); 
    const [filterMinPayGrade, setFilterMinPayGrade] = useState(0); 
    const [filterMinFansLevel, setFilterMinFansLevel] = useState(0); 

    // ✅✅✅ 新增：防抖后的值 (Debounced: 用于传给 API)
    const debouncedFilterMinPayGrade = useDebounce(filterMinPayGrade, 500);
    const debouncedFilterMinFansLevel = useDebounce(filterMinFansLevel, 500);

    // Tab 相关
    const [desktopTab, setDesktopTab] = useState<'chat' | 'pk'>('chat');
    const [mobileTab, setMobileTab] = useState<'chat' | 'gift' | 'pk'>('chat');
    const [isStatsOpen, setIsStatsOpen] = useState(false);

    // Actions
    const handleSearch = () => { if (inputSearch !== appliedSearch) setAppliedSearch(inputSearch); };
    
    const handleReset = () => { 
        setInputSearch(''); 
        setAppliedSearch('');
        setEnableMinPrice(false);
        setFilterGender(null);
        setFilterMinPayGrade(0);
        setFilterMinFansLevel(0);
    };
    
    const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSearch(); };

    return {
        searchState: {
            searchTarget, setSearchTarget,
            inputSearch, setInputSearch,
            appliedSearch,
            minPriceInput, setMinPriceInput,
            enableMinPrice, setEnableMinPrice,
            debouncedMinPrice,
            
            // 导出原始值 (给 Input 绑定用)
            filterGender, setFilterGender,
            filterMinPayGrade, setFilterMinPayGrade,
            filterMinFansLevel, setFilterMinFansLevel,

            // ✅ 导出防抖值 (给 API 请求用)
            debouncedFilterMinPayGrade,
            debouncedFilterMinFansLevel
        },
        tabState: { desktopTab, setDesktopTab, mobileTab, setMobileTab },
        modalState: { isStatsOpen, setIsStatsOpen },
        actions: { handleSearch, handleReset, handleKeyDown }
    };
}