'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, FileDown, Loader2, Search, Sparkles, Wrench } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface AuthorSuggestion {
  sec_uid: string;
  nickname: string;
  avatar?: string;
}

interface RoomOption {
  room_id: string;
  title: string;
  nickname?: string;
  created_at?: string;
  end_time?: string;
  live_status: number;
  total_diamond_count?: number;
}

interface PreviewMeta {
  sec_uid: string;
  room_id: string;
  anchor_name: string;
  room_title: string;
  start_time: string;
  end_time: string;
}

interface GiftPreviewRow {
  rank: number;
  user_name: string;
  display_id: string;
  sec_uid: string;
  profile_url: string;
  total_count: number;
  send_times: string[];
  gift_list: string[];
}

interface SpenderPreviewRow {
  rank: number;
  user_name: string;
  display_id: string;
  sec_uid: string;
  profile_url: string;
  total_diamond_count: number;
  gift_list: string[];
}

interface GiftPreviewResponse {
  meta: PreviewMeta;
  gift_keywords: string[];
  rows: GiftPreviewRow[];
}

interface SpenderPreviewResponse {
  meta: PreviewMeta;
  min_total_diamond: number;
  rows: SpenderPreviewRow[];
}

type ToolTab = 'gift' | 'spender';

function formatLocalInput(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function formatDisplayTime(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function splitKeywords(input: string) {
  return Array.from(
    new Set(
      input
        .split(/[\n;；]+/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

export default function ToolsPage() {
  const router = useRouter();
  const suggestionRef = useRef<HTMLDivElement | null>(null);

  const [activeTab, setActiveTab] = useState<ToolTab>('gift');
  const [authorQuery, setAuthorQuery] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState<AuthorSuggestion | null>(null);
  const [authorSuggestions, setAuthorSuggestions] = useState<AuthorSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingAuthors, setSearchingAuthors] = useState(false);
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [giftKeywordsInput, setGiftKeywordsInput] = useState('');
  const [minDiamond, setMinDiamond] = useState('1000');
  const [giftPreview, setGiftPreview] = useState<GiftPreviewResponse | null>(null);
  const [spenderPreview, setSpenderPreview] = useState<SpenderPreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.room_id === selectedRoomId) || null,
    [rooms, selectedRoomId]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const trimmed = authorQuery.trim();
    if (!trimmed || (selectedAuthor && trimmed === selectedAuthor.nickname)) {
      setAuthorSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingAuthors(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&limit=8`);
        if (!response.ok) throw new Error('主播搜索失败');
        const data = await response.json();
        setAuthorSuggestions(data);
        setShowSuggestions(true);
      } catch (error) {
        console.error(error);
        setAuthorSuggestions([]);
      } finally {
        setSearchingAuthors(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [authorQuery, selectedAuthor]);

  const resetPreviews = () => {
    setGiftPreview(null);
    setSpenderPreview(null);
    setErrorMessage('');
  };

  const applyRoomTime = (room: RoomOption | null) => {
    if (!room) {
      setStartTime('');
      setEndTime('');
      return;
    }

    setStartTime(formatLocalInput(room.created_at));
    setEndTime(formatLocalInput(room.end_time || new Date().toISOString()));
  };

  const loadRooms = async (author: AuthorSuggestion) => {
    setLoadingRooms(true);
    setRooms([]);
    setSelectedRoomId('');
    applyRoomTime(null);
    resetPreviews();

    try {
      const response = await fetch(`/api/authors/${author.sec_uid}/rooms?limit=0`);
      if (!response.ok) throw new Error('获取场次失败');
      const data = await response.json();
      setRooms(data);
      if (data.length > 0) {
        setSelectedRoomId(data[0].room_id);
        applyRoomTime(data[0]);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage('场次加载失败，请稍后再试。');
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleSelectAuthor = async (author: AuthorSuggestion) => {
    setSelectedAuthor(author);
    setAuthorQuery(author.nickname);
    setShowSuggestions(false);
    await loadRooms(author);
  };

  const handleAuthorInput = (value: string) => {
    setAuthorQuery(value);
    if (selectedAuthor && value !== selectedAuthor.nickname) {
      setSelectedAuthor(null);
      setRooms([]);
      setSelectedRoomId('');
      applyRoomTime(null);
      resetPreviews();
    }
  };

  const handleRoomChange = (roomId: string) => {
    setSelectedRoomId(roomId);
    const room = rooms.find((item) => item.room_id === roomId) || null;
    applyRoomTime(room);
    resetPreviews();
  };

  const ensureCommonPayload = () => {
    if (!selectedAuthor) {
      throw new Error('请先选择主播');
    }
    if (!selectedRoomId) {
      throw new Error('请先选择场次');
    }
    if (!startTime || !endTime) {
      throw new Error('请设置完整的时间范围');
    }
    return {
      sec_uid: selectedAuthor.sec_uid,
      room_id: selectedRoomId,
      start_time: startTime,
      end_time: endTime,
    };
  };

  const handlePreview = async () => {
    resetPreviews();
    setPreviewLoading(true);

    try {
      const commonPayload = ensureCommonPayload();

      if (activeTab === 'gift') {
        const giftKeywords = splitKeywords(giftKeywordsInput);
        if (giftKeywords.length === 0) throw new Error('请至少输入一个礼物关键词');

        const response = await fetch('/api/tools/gift-report/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...commonPayload,
            gift_keywords: giftKeywords,
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || '礼物预览失败');
        setGiftPreview(data);
      } else {
        const threshold = Number(minDiamond);
        if (!Number.isFinite(threshold) || threshold < 0) throw new Error('请输入有效的消费阈值');

        const response = await fetch('/api/tools/spender-threshold/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...commonPayload,
            min_total_diamond: threshold,
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || '阈值预览失败');
        setSpenderPreview(data);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '预览失败';
      setErrorMessage(message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = async () => {
    setErrorMessage('');
    setDownloadLoading(true);

    try {
      const commonPayload = ensureCommonPayload();
      const endpoint =
        activeTab === 'gift'
          ? '/api/tools/gift-report/export'
          : '/api/tools/spender-threshold/export';

      const payload =
        activeTab === 'gift'
          ? {
              ...commonPayload,
              gift_keywords: splitKeywords(giftKeywordsInput),
            }
          : {
              ...commonPayload,
              min_total_diamond: Number(minDiamond),
            };

      if (activeTab === 'gift') {
        // 使用 'in' 关键字让 TypeScript 确认属性存在
        if ('gift_keywords' in payload && payload.gift_keywords.length === 0) {
          throw new Error('请至少输入一个礼物关键词');
        }
      } else if ('min_total_diamond' in payload && (!Number.isFinite(payload.min_total_diamond) || payload.min_total_diamond < 0)) {
        throw new Error('请输入有效的消费阈值');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        let detail = '下载失败';
        try {
          const data = await response.json();
          detail = data.detail || detail;
        } catch {
          detail = '下载失败';
        }
        throw new Error(detail);
      }

      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition');
      const fileNameMatch = disposition?.match(/filename="(.+)"/);
      const fileName = fileNameMatch?.[1] || `${activeTab}_report.html`;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : '下载失败';
      setErrorMessage(message);
    } finally {
      setDownloadLoading(false);
    }
  };

  const previewMeta = giftPreview?.meta || spenderPreview?.meta || null;

  return (
    <main className="min-h-screen bg-background text-foreground p-4 md:p-8 selection:bg-primary selection:text-primary-foreground">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-card/80 px-5 py-6 shadow-[0_20px_60px_rgba(0,0,0,0.15)] backdrop-blur md:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(18,57,85,0.22),transparent_40%),linear-gradient(135deg,rgba(255,255,255,0.05),transparent)]" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-primary uppercase">
                <Wrench className="h-3.5 w-3.5" />
                Tools Export
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">导出工具页</h1>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                  面向单主播、单场次、单时间段的 HTML 单文件导出。先锁定主播和场次，再按礼物关键词或消费阈值预览、下载。
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => router.push('/')}>
                <ArrowLeft className="h-4 w-4" />
                返回首页
              </Button>
              <Button variant="outline" onClick={() => router.push('/search')}>
                <Search className="h-4 w-4" />
                去搜索页
              </Button>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          <Card className="border-primary/15 bg-card/85 py-4">
            <CardHeader className="space-y-2">
              <CardTitle className="text-xl font-black tracking-tight">筛选条件</CardTitle>
              <CardDescription>先选主播和场次，再缩小时间段，最后切换导出模式。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2" ref={suggestionRef}>
                <label className="text-sm font-semibold text-foreground">主播</label>
                <div className="relative">
                  <Input
                    value={authorQuery}
                    onChange={(event) => handleAuthorInput(event.target.value)}
                    placeholder="输入主播昵称关键词"
                    className="pr-10"
                  />
                  {searchingAuthors ? (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                  ) : (
                    <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  )}
                  {showSuggestions && authorSuggestions.length > 0 && (
                    <div className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-border bg-card p-2 shadow-2xl">
                      {authorSuggestions.map((author) => (
                        <button
                          key={author.sec_uid}
                          type="button"
                          onClick={() => void handleSelectAuthor(author)}
                          className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-muted/60"
                        >
                          <span className="font-semibold text-foreground">{author.nickname}</span>
                          <span className="ml-4 text-xs text-muted-foreground">{author.sec_uid.slice(0, 10)}...</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">场次</label>
                <select
                  value={selectedRoomId}
                  onChange={(event) => handleRoomChange(event.target.value)}
                  disabled={!selectedAuthor || loadingRooms}
                  className="flex h-11 w-full rounded-2xl border border-primary/20 bg-background/70 px-4 text-sm outline-none transition focus:border-primary"
                >
                  <option value="">{loadingRooms ? '场次加载中...' : '请选择场次'}</option>
                  {rooms.map((room) => (
                    <option key={room.room_id} value={room.room_id}>
                      {formatDisplayTime(room.created_at)} · {room.title || '未命名场次'}
                    </option>
                  ))}
                </select>
                {selectedRoom && (
                  <p className="text-xs leading-6 text-muted-foreground">
                    默认时间：{formatDisplayTime(selectedRoom.created_at)} - {formatDisplayTime(selectedRoom.end_time || selectedRoom.created_at)}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">开始时间</label>
                  <Input type="datetime-local" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">结束时间</label>
                  <Input type="datetime-local" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-primary/15 bg-primary/5 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
                  <Sparkles className="h-4 w-4" />
                  当前选择
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>主播：{selectedAuthor?.nickname || '未选择'}</p>
                  <p>场次：{selectedRoom?.title || '未选择'}</p>
                  <p>时间：{startTime || '-'} 至 {endTime || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/15 bg-card/85 py-4">
            <CardHeader className="space-y-2">
              <CardTitle className="text-xl font-black tracking-tight">导出模式</CardTitle>
              <CardDescription>先预览再下载，便于你手动校对结果。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ToolTab)}>
                <TabsList className="h-auto w-full rounded-2xl bg-muted/70 p-1">
                  <TabsTrigger value="gift" className="py-2">礼物导出</TabsTrigger>
                  <TabsTrigger value="spender" className="py-2">消费阈值导出</TabsTrigger>
                </TabsList>

                <TabsContent value="gift" className="mt-5 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">礼物关键词</label>
                    <textarea
                      value={giftKeywordsInput}
                      onChange={(event) => {
                        setGiftKeywordsInput(event.target.value);
                        setGiftPreview(null);
                      }}
                      placeholder="每行一个，或使用分号分隔。多个词按任一命中处理。"
                      className="min-h-32 w-full rounded-[1.5rem] border border-primary/20 bg-background/60 px-4 py-3 text-sm outline-none transition focus:border-primary"
                    />
                    <p className="text-xs text-muted-foreground">当前解析：{splitKeywords(giftKeywordsInput).join('、') || '暂无关键词'}</p>
                  </div>
                </TabsContent>

                <TabsContent value="spender" className="mt-5 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">消费阈值（钻石）</label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={minDiamond}
                      onChange={(event) => {
                        setMinDiamond(event.target.value);
                        setSpenderPreview(null);
                      }}
                      placeholder="例如 1000"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex flex-wrap gap-3">
                <Button onClick={() => void handlePreview()} disabled={previewLoading || downloadLoading}>
                  {previewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  预览
                </Button>
                <Button variant="outline" onClick={() => void handleDownload()} disabled={previewLoading || downloadLoading}>
                  {downloadLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  下载 HTML
                </Button>
              </div>

              {errorMessage && (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {errorMessage}
                </div>
              )}

              <div className="rounded-[1.75rem] border border-border bg-background/40 p-4 md:p-5">
                <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-foreground">预览结果</h2>
                    <p className="text-sm text-muted-foreground">
                      {previewMeta
                        ? `${previewMeta.anchor_name} · ${previewMeta.room_title || '未命名场次'} · ${previewMeta.start_time} - ${previewMeta.end_time}`
                        : '先进行一次预览，这里会展示导出前结果。'}
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs text-primary">
                    <FileDown className="h-3.5 w-3.5" />
                    {activeTab === 'gift'
                      ? `礼物名单 ${giftPreview?.rows.length ?? 0} 人`
                      : `阈值名单 ${spenderPreview?.rows.length ?? 0} 人`}
                  </div>
                </div>

                {activeTab === 'gift' && giftPreview && (
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      礼物关键词：{giftPreview.gift_keywords.join('；')}
                    </div>
                    {giftPreview.rows.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                        该时间段内没有命中礼物关键词的用户。
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>序号</TableHead>
                            <TableHead>昵称</TableHead>
                            <TableHead>抖音号</TableHead>
                            <TableHead>主页链接</TableHead>
                            <TableHead>赠送数量</TableHead>
                            <TableHead>赠送时间</TableHead>
                            <TableHead>礼物清单</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {giftPreview.rows.map((row) => (
                            <TableRow key={`${row.rank}-${row.user_name}`}>
                              <TableCell>{row.rank}</TableCell>
                              <TableCell className="font-semibold">{row.user_name}</TableCell>
                              <TableCell>{row.display_id || '-'}</TableCell>
                              <TableCell>
                                {row.profile_url ? (
                                  <a href={row.profile_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                    查看主页
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground">暂无主页</span>
                                )}
                              </TableCell>
                              <TableCell>{row.total_count}</TableCell>
                              <TableCell className="max-w-56 whitespace-normal text-xs leading-6">{row.send_times.join('；') || '-'}</TableCell>
                              <TableCell className="max-w-56 whitespace-normal text-xs leading-6">{row.gift_list.join('；') || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                )}

                {activeTab === 'spender' && spenderPreview && (
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      消费阈值：{spenderPreview.min_total_diamond} 钻石
                    </div>
                    {spenderPreview.rows.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                        该时间段内没有达到阈值的用户。
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>序号</TableHead>
                            <TableHead>昵称</TableHead>
                            <TableHead>抖音号</TableHead>
                            <TableHead>主页链接</TableHead>
                            <TableHead>总消费</TableHead>
                            <TableHead>礼物清单</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {spenderPreview.rows.map((row) => (
                            <TableRow key={`${row.rank}-${row.user_name}`}>
                              <TableCell>{row.rank}</TableCell>
                              <TableCell className="font-semibold">{row.user_name}</TableCell>
                              <TableCell>{row.display_id || '-'}</TableCell>
                              <TableCell>
                                {row.profile_url ? (
                                  <a href={row.profile_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                    查看主页
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground">暂无主页</span>
                                )}
                              </TableCell>
                              <TableCell>{row.total_diamond_count}</TableCell>
                              <TableCell className="max-w-56 whitespace-normal text-xs leading-6">{row.gift_list.join('；') || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                )}

                {!giftPreview && !spenderPreview && !previewLoading && (
                  <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                    还没有预览数据。先选择主播、场次和时间范围，再点击上方“预览”。
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
