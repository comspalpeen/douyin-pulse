'use client';

import { useState, useEffect } from 'react';

interface QnA {
    id?: string;
    question: string;
    answer: string;
    order: number;
    is_visible: boolean;
}

export default function AdminQnaPage() {
    const [list, setList] = useState<QnA[]>([]);
    const [loading, setLoading] = useState(false);
    
    // 表单状态
    const [form, setForm] = useState<QnA>({ question: '', answer: '', order: 0, is_visible: true });
    // 编辑状态：存储当前正在编辑的 ID，如果为 null 则为新增模式
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchList = async () => {
        try {
            const res = await fetch('/api/qna?visible_only=false');
            if (res.ok) {
                setList(await res.json());
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => { fetchList(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 构造提交数据：如果是编辑模式，必须带上 id
            const payload = editingId ? { ...form, id: editingId } : form;

            const res = await fetch('/api/qna', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                resetForm(); // 提交成功清空表单
                fetchList(); // 刷新列表
            } else {
                alert("保存失败，请重试");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if(!confirm('确定删除这条问答吗?')) return;
        await fetch(`/api/qna/${id}`, { method: 'DELETE' });
        fetchList();
    };

    const handleEdit = (item: QnA) => {
        if (!item.id) return;
        // 填充表单
        setForm({
            question: item.question,
            answer: item.answer,
            order: item.order,
            is_visible: item.is_visible
        });
        setEditingId(item.id); // 标记正在编辑的 ID
        
        // 滚动到顶部方便编辑
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setForm({ question: '', answer: '', order: 0, is_visible: true });
        setEditingId(null);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-12 text-gray-900">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Q&A 内容管理</h1>
                    <button onClick={fetchList} className="text-blue-600 hover:underline">刷新列表</button>
                </div>
                
                {/* 输入表单区域 */}
                <div className={`p-6 rounded-xl shadow-sm border mb-8 transition-colors ${editingId ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">
                            {editingId ? '✏️ 编辑模式' : '➕ 添加新问答'}
                        </h2>
                        {editingId && (
                            <button onClick={resetForm} className="text-sm text-gray-500 hover:text-gray-700 underline">
                                取消编辑
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* 问题输入 */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">问题 (Question)</label>
                            <input 
                                type="text" 
                                required
                                className="w-full border border-gray-300 bg-white text-gray-900 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                placeholder="输入用户常问的问题..."
                                value={form.question}
                                onChange={e => setForm({...form, question: e.target.value})}
                            />
                        </div>

                        {/* 回答输入 */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">回答 (Answer)</label>
                            <textarea 
                                required
                                className="w-full border border-gray-300 bg-white text-gray-900 p-3 rounded-lg h-32 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="输入详细解答..."
                                value={form.answer}
                                onChange={e => setForm({...form, answer: e.target.value})}
                            />
                        </div>

                        <div className="flex flex-col md:flex-row gap-6">
                            {/* 权重 */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">排序权重</label>
                                <input 
                                    type="number" 
                                    className="border border-gray-300 bg-white text-gray-900 p-2 rounded-lg w-32 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={form.order}
                                    onChange={e => setForm({...form, order: parseInt(e.target.value) || 0})}
                                />
                                <p className="text-xs text-gray-500 mt-1">数字越大越靠前</p>
                            </div>

                            {/* 显示开关 */}
                            <div className="flex items-center pt-6">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input 
                                        type="checkbox" 
                                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                        checked={form.is_visible}
                                        onChange={e => setForm({...form, is_visible: e.target.checked})}
                                    />
                                    <span className="text-gray-700 font-medium">在前台显示</span>
                                </label>
                            </div>
                        </div>

                        {/* 提交按钮 */}
                        <div className="pt-2 flex gap-3">
                            <button 
                                type="submit" 
                                disabled={loading}
                                className={`px-8 py-2.5 rounded-lg text-white font-bold shadow-md transition-all ${
                                    editingId 
                                    ? 'bg-orange-600 hover:bg-orange-700' 
                                    : 'bg-blue-600 hover:bg-blue-700'
                                } disabled:opacity-50`}
                            >
                                {loading ? '提交中...' : (editingId ? '保存修改' : '立即发布')}
                            </button>
                            
                            {editingId && (
                                <button 
                                    type="button" 
                                    onClick={resetForm} 
                                    className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 font-medium"
                                >
                                    放弃
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* 列表展示区域 */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-700 pl-1">已发布列表 ({list.length})</h3>
                    
                    {list.length === 0 && (
                        <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed">暂无数据</div>
                    )}

                    {list.map(item => (
                        <div 
                            key={item.id} 
                            className={`bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between group transition-all hover:border-blue-200 ${editingId === item.id ? 'ring-2 ring-blue-400' : ''}`}
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded">
                                        #{item.order}
                                    </span>
                                    {!item.is_visible && (
                                        <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded">
                                            已隐藏
                                        </span>
                                    )}
                                    <h4 className="font-bold text-lg text-gray-900">{item.question}</h4>
                                </div>
                                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap pl-1">
                                    {item.answer}
                                </p>
                            </div>

                            {/* 操作按钮 */}
                            <div className="flex md:flex-col gap-2 items-end justify-start min-w-[80px]">
                                <button 
                                    onClick={() => handleEdit(item)} 
                                    className="text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded transition-colors w-full"
                                >
                                    编辑
                                </button>
                                <button 
                                    onClick={() => item.id && handleDelete(item.id)} 
                                    className="text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded transition-colors w-full"
                                >
                                    删除
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}