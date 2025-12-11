'use client';

import { useState, useEffect } from 'react';

interface QnA {
    id: string;
    question: string;
    answer: string;
}

export default function QnaModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [qnaList, setQnaList] = useState<QnA[]>([]);

    // 加载数据
    useEffect(() => {
        if (isOpen && qnaList.length === 0) {
            fetch('/api/qna')
                .then(res => res.json())
                .then(data => setQnaList(data))
                .catch(err => console.error(err));
        }
    }, [isOpen]);

    return (
        <>
            {/* 1. 悬浮入口按钮 (放在右下角) */}
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-40 bg-blue-600 hover:bg-blue-700 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 group"
                title="常见问题"
            >
                <span className="text-xl font-bold">?</span>
                {/* Tooltip */}
                <span className="absolute right-full mr-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    常见问题 Q&A
                </span>
            </button>

            {/* 2. 模态框 */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsOpen(false)}>
                    <div 
                        className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white">💡 常见问题 Q&A</h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                        </div>

                        {/* Content Scroll */}
                        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                            {qnaList.length === 0 ? (
                                <div className="text-center text-gray-400 py-10">暂无内容</div>
                            ) : (
                                qnaList.map((item, index) => (
                                    <div key={item.id} className="group">
                                        <div className="flex items-start gap-3 mb-2">
                                            <span className="bg-blue-100 text-blue-600 font-bold text-xs px-2 py-0.5 rounded mt-0.5">Q{index + 1}</span>
                                            <h4 className="font-bold text-gray-800 dark:text-gray-200 leading-relaxed">
                                                {item.question}
                                            </h4>
                                        </div>
                                        <div className="pl-10 text-sm text-gray-600 dark:text-gray-400 leading-relaxed border-l-2 border-gray-100 dark:border-gray-800 ml-2 py-1">
                                            {item.answer}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        
                        {/* Footer (Optional) */}
                        <div className="p-4 border-t border-gray-100 dark:border-gray-800 text-center text-xs text-gray-400 bg-gray-50 dark:bg-gray-800/30">
                            还有疑问？请联系首页最后一位@kuku
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}