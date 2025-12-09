"use client";
import { useState, useEffect } from 'react';

// 简单的日期格式化
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('zh-CN', { hour12: false });
};

export default function AdminPage() {
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  
  const [cookieList, setCookieList] = useState([]);
  
  // 输入框状态
  const [inputNote, setInputNote] = useState('');
  const [inputCookie, setInputCookie] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 编辑状态标记 (记录正在编辑哪个备注)
  const [editingNote, setEditingNote] = useState(null);

  // 初始化检查
  useEffect(() => {
    const savedPwd = localStorage.getItem('admin_pwd');
    if (savedPwd) {
      setPassword(savedPwd);
      handleLogin(savedPwd);
    }
  }, []);

  const handleLogin = (pwdInput = password) => {
    if (pwdInput) {
      fetchCookies(pwdInput).then(ok => {
        if (ok) {
            setAuthorized(true);
            localStorage.setItem('admin_pwd', pwdInput);
        }
      });
    }
  };

  const fetchCookies = async (pwd) => {
    try {
      const res = await fetch('/api/admin/cookies', {
        headers: { 'x-admin-token': pwd }
      });
      if (res.ok) {
        const data = await res.json();
        setCookieList(data);
        return true;
      } else if (res.status === 403) {
        if (authorized) alert("鉴权失败，请重新登录");
        setAuthorized(false);
        localStorage.removeItem('admin_pwd');
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  const handleSubmit = async () => {
    if (!inputNote) {
        alert("请填写账号备注！");
        return;
    }
    
    setLoading(true);
    const res = await fetch('/api/admin/cookies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': password },
      body: JSON.stringify({ note: inputNote, cookie: inputCookie })
    });
    
    if (res.ok) {
        resetForm(); // 提交成功清空表单
        fetchCookies(password);
    } else {
        alert("操作失败");
    }
    setLoading(false);
  };

  const handleDelete = async (item) => {
    if (!confirm(`确定删除账号 [${item.note || '无备注'}] 吗？\n这是彻底删除，无法恢复！`)) return;
    
    await fetch('/api/admin/cookies', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': password },
      body: JSON.stringify({ note: item.note, cookie: item.cookie })
    });
    fetchCookies(password);
  };

  // 点击“编辑” / “修复”
  const handleEdit = (item) => {
    // 填充数据
    setInputNote(item.note || '');
    setInputCookie(item.cookie || '');
    
    // 标记状态：正在编辑这个备注
    setEditingNote(item.note);

    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 取消编辑 / 重置表单
  const resetForm = () => {
    setInputNote('');
    setInputCookie('');
    setEditingNote(null);
  };

  if (!authorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="p-8 bg-white rounded shadow-md w-96">
          <h1 className="mb-6 text-2xl font-bold text-center text-gray-800">后台管理</h1>
          <input 
            type="password" 
            className="border p-3 w-full rounded mb-4 text-gray-900 bg-white"
            placeholder="访问密钥"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button onClick={() => handleLogin()} className="w-full bg-blue-600 text-white p-3 rounded font-bold">登录</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">账号池管理</h1>
            <div className="space-x-4">
                <button onClick={() => fetchCookies(password)} className="text-blue-600 underline">刷新列表</button>
                <button onClick={() => {setAuthorized(false); localStorage.removeItem('admin_pwd')}} className="text-gray-500 underline">退出</button>
            </div>
        </div>

        {/* 添加/编辑区域 */}
        <div className={`p-6 rounded-lg shadow mb-8 border transition-colors ${editingNote ? 'bg-blue-50 border-blue-200' : 'bg-white border-blue-100'}`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">
              {editingNote ? `✏️ 正在编辑: ${editingNote}` : '➕ 添加 / 更新账号'}
            </h2>
            {editingNote && (
                <button onClick={resetForm} className="text-sm text-gray-500 hover:text-gray-700 underline">取消编辑 (切换为新增)</button>
            )}
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="md:w-1/4">
                <label className="block text-sm font-bold text-gray-600 mb-1">账号备注 (唯一标识)</label>
                <input 
                  className={`w-full border border-gray-300 p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 ${editingNote ? 'bg-gray-200 cursor-not-allowed text-gray-500' : 'bg-white'}`}
                  placeholder="例如: 抖音小号01" 
                  value={inputNote}
                  // 🔴 核心修复：编辑模式下禁止修改备注，防止生成重复数据
                  disabled={!!editingNote}
                  onChange={e => setInputNote(e.target.value)}
                />
                {editingNote && <p className="text-xs text-orange-600 mt-1 font-bold">⚠️ 编辑模式下不可修改备注名</p>}
            </div>
            <div className="md:w-3/4">
                <label className="block text-sm font-bold text-gray-600 mb-1">Cookie 内容</label>
                <input 
                  className="w-full border border-gray-300 p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm text-gray-900 bg-white"
                  placeholder="粘贴完整的 Cookie 字符串..." 
                  value={inputCookie}
                  onChange={e => setInputCookie(e.target.value)}
                />
            </div>
          </div>
          <div className="text-right">
            <button 
              onClick={handleSubmit} 
              disabled={loading}
              className={`${editingNote ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-8 py-2 rounded font-bold shadow-md transition`}
            >
              {loading ? '提交中...' : (editingNote ? '确认修改 (覆盖旧值)' : '保存新账号')}
            </button>
          </div>
        </div>

        {/* 列表区域 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 text-gray-600 text-sm uppercase">
              <tr>
                <th className="p-4 w-16 text-center">状态</th>
                <th className="p-4 w-1/4">账号备注</th>
                <th className="p-4">Cookie 摘要</th>
                <th className="p-4 w-40 text-center">操作</th>
              </tr>
            </thead>
            {/* 🔴 修复报错的核心：tbody 内部不要有任何注释或换行空格 */}
            <tbody className="divide-y divide-gray-100 text-gray-800">
              {cookieList.map((item, idx) => {
                const isExpired = !item.cookie;
                const isEditing = editingNote === item.note;
                return (
                  <tr key={idx} className={`hover:bg-gray-50 transition ${isExpired ? 'bg-red-50' : ''} ${isEditing ? 'bg-blue-50 ring-2 ring-inset ring-blue-200' : ''}`}>
                    <td className="p-4 text-center">
                      {isExpired ? (
                        <span className="inline-block px-2 py-1 text-xs font-bold text-red-600 bg-red-100 rounded">失效</span>
                      ) : (
                        <span className="inline-block px-2 py-1 text-xs font-bold text-green-600 bg-green-100 rounded">正常</span>
                      )}
                    </td>
                    <td className="p-4 font-medium">
                        <div className="text-gray-900 text-base">{item.note || <span className="text-gray-400 italic">无备注</span>}</div>
                        <div className="text-xs text-gray-400 mt-1">更新于: {formatDate(item.updated_at)}</div>
                    </td>
                    <td className="p-4">
                        <div className="font-mono text-xs text-gray-600 break-all line-clamp-2">
                            {isExpired ? (
                                <span className="text-red-500 font-bold">⛔ Cookie 已清除，请点击右侧“修复”填入新值</span>
                            ) : (
                                item.cookie
                            )}
                        </div>
                    </td>
                    <td className="p-4 text-center space-x-2">
                      <button 
                        onClick={() => handleEdit(item)}
                        className={`text-sm font-semibold px-3 py-1 rounded border transition ${
                            isExpired 
                            ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' 
                            : 'text-blue-600 border-blue-200 hover:bg-blue-50 bg-white'
                        }`}
                      >
                        {isExpired ? '修复' : '编辑'}
                      </button>
                      <button 
                        onClick={() => handleDelete(item)}
                        className="text-sm font-semibold text-red-500 px-3 py-1 rounded border border-transparent hover:bg-red-50 hover:border-red-100 bg-white transition"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                );
              })}
              {cookieList.length === 0 && (
                <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-400">暂无数据，请在上方添加</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}