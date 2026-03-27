"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Lock, RefreshCw, Save, ShieldCheck, Unlock } from "lucide-react";

type SystemSettingsPayload = {
  api_switch: number;
  enable_zero_level_shield: boolean;
  active_shield_days: number;
  api_query_limit: number;
  api_query_window: number;
  global_api_query_limit: number;
};

type SettingsFormState = {
  api_switch: number;
  enable_zero_level_shield: boolean;
  active_shield_days: number | "";
  api_query_limit: number | "";
  api_query_window: number | "";
  global_api_query_limit: number | "";
};

const DEFAULT_SETTINGS: SystemSettingsPayload = {
  api_switch: 1,
  enable_zero_level_shield: true,
  active_shield_days: 3,
  api_query_limit: 600,
  api_query_window: 3600,
  global_api_query_limit: 20000,
};

const API_SWITCH_OPTIONS = [
  { value: 0, title: "0 - 数据库模式", desc: "禁用外部 API，只返回数据库历史数据。" },
  { value: 1, title: "1 - 实时更新模式", desc: "默认模式，可联网查询并动态更新结果。" },
  { value: 2, title: "2 - 仅转换模式", desc: "只做 display_id → sec_uid 转换，不请求实时等级。" },
] as const;

export default function AdminSettingsPage() {
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [settings, setSettings] = useState<SettingsFormState>(DEFAULT_SETTINGS);

  useEffect(() => {
    const savedPwd = localStorage.getItem("admin_pwd");
    if (savedPwd) {
      setPassword(savedPwd);
      handleLogin(savedPwd);
    }
  }, []);

  const normalizeNumberField = (value: number | "", fallback: number, min: number) => {
    if (value === "") {
      return fallback;
    }

    const parsed = typeof value === "number" ? value : Number.parseInt(String(value), 10);
    if (Number.isNaN(parsed)) {
      return fallback;
    }

    return Math.max(min, parsed);
  };

  const normalizeSettings = (current: SettingsFormState): SystemSettingsPayload => ({
    api_switch: current.api_switch,
    enable_zero_level_shield: current.enable_zero_level_shield,
    active_shield_days: normalizeNumberField(current.active_shield_days, DEFAULT_SETTINGS.active_shield_days, 0),
    api_query_limit: normalizeNumberField(current.api_query_limit, DEFAULT_SETTINGS.api_query_limit, 1),
    api_query_window: normalizeNumberField(current.api_query_window, DEFAULT_SETTINGS.api_query_window, 1),
    global_api_query_limit: normalizeNumberField(
      current.global_api_query_limit,
      DEFAULT_SETTINGS.global_api_query_limit,
      1
    ),
  });

  const setNumericField = (field: keyof Pick<SettingsFormState, "active_shield_days" | "api_query_limit" | "api_query_window" | "global_api_query_limit">, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value === "" ? "" : value,
    }));
  };

  const handleNumericBlur = (
    field: keyof Pick<SettingsFormState, "active_shield_days" | "api_query_limit" | "api_query_window" | "global_api_query_limit">,
    fallback: number,
    min: number
  ) => {
    setSettings((prev) => ({
      ...prev,
      [field]: normalizeNumberField(prev[field], fallback, min),
    }));
  };

  const normalizedSettings = normalizeSettings(settings);
  const safeWindowMinutes = useMemo(
    () => Math.ceil(normalizedSettings.api_query_window / 60),
    [normalizedSettings.api_query_window]
  );

  const fetchSettings = async (pwd: string): Promise<boolean> => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/settings", {
        headers: { "x-admin-token": pwd },
      });

      if (res.ok) {
        const data: Partial<SystemSettingsPayload> = await res.json();
        setSettings({
          api_switch: Number.isFinite(data.api_switch) ? Number(data.api_switch) : DEFAULT_SETTINGS.api_switch,
          enable_zero_level_shield:
            typeof data.enable_zero_level_shield === "boolean"
              ? data.enable_zero_level_shield
              : DEFAULT_SETTINGS.enable_zero_level_shield,
          active_shield_days: Number.isFinite(data.active_shield_days)
            ? Math.max(0, Number(data.active_shield_days))
            : DEFAULT_SETTINGS.active_shield_days,
          api_query_limit: Number.isFinite(data.api_query_limit)
            ? Math.max(1, Number(data.api_query_limit))
            : DEFAULT_SETTINGS.api_query_limit,
          api_query_window: Number.isFinite(data.api_query_window)
            ? Math.max(1, Number(data.api_query_window))
            : DEFAULT_SETTINGS.api_query_window,
          global_api_query_limit: Number.isFinite(data.global_api_query_limit)
            ? Math.max(1, Number(data.global_api_query_limit))
            : DEFAULT_SETTINGS.global_api_query_limit,
        });
        return true;
      }

      if (res.status === 403) {
        setError("鉴权失败，请确认管理员密钥。");
      } else {
        setError("读取配置失败，请稍后重试。");
      }
      return false;
    } catch (e) {
      console.error(e);
      setError("网络异常，无法读取配置。");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (pwdInput = password) => {
    if (!pwdInput.trim()) {
      setError("请输入管理员密钥。");
      return;
    }
    const ok = await fetchSettings(pwdInput);
    if (ok) {
      setAuthorized(true);
      localStorage.setItem("admin_pwd", pwdInput);
      setSuccess("鉴权成功，配置已加载。");
    } else {
      setAuthorized(false);
      localStorage.removeItem("admin_pwd");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    const payload = normalizeSettings(settings);
    setSettings(payload);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": password,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccess("配置已保存并实时生效。");
      } else if (res.status === 403) {
        setError("鉴权失效，请重新登录。");
        setAuthorized(false);
        localStorage.removeItem("admin_pwd");
      } else {
        setError("保存失败，请检查参数后重试。");
      }
    } catch (e) {
      console.error(e);
      setError("网络异常，保存失败。");
    } finally {
      setSaving(false);
    }
  };

  if (!authorized) {
    return (
      <div className="flex min-h-[75vh] items-center justify-center p-6">
        <Card className="w-full max-w-md border-border bg-card/60 backdrop-blur-sm shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-1 w-fit rounded-full bg-primary/10 p-3">
              <Lock className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-2xl font-black tracking-tight">系统控制面板鉴权</CardTitle>
            <CardDescription>输入管理员密钥后可读取和修改 czlevel 动态配置</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              value={password}
              placeholder="x-admin-token"
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="h-11"
            />
            <Button onClick={() => handleLogin()} className="h-11 w-full font-bold">
              验证并进入
            </Button>
            {error ? <p className="text-center text-sm text-destructive">{error}</p> : null}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-7">
        <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-black tracking-tight text-foreground">
              <ShieldCheck className="h-8 w-8 text-primary" />
              CzLevel 系统控制面板
            </h1>
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              实时控制联网开关、业务盾牌和每 IP 查询限流参数
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={() => fetchSettings(password)} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4 text-primary" />
              {loading ? "读取中..." : "刷新配置"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setAuthorized(false);
                setSuccess("");
                setError("");
                localStorage.removeItem("admin_pwd");
              }}
            >
              <Unlock className="mr-2 h-4 w-4" />
              锁定退出
            </Button>
            <Link href="/admin" className="text-sm text-primary hover:underline">
              返回管理首页
            </Link>
          </div>
        </div>

        <Card className="border-border shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">联网策略</CardTitle>
            <CardDescription>对应 setting:czlevel_api_switch，控制外部接口调用行为</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {API_SWITCH_OPTIONS.map((option) => {
              const selected = settings.api_switch === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSettings((prev) => ({ ...prev, api_switch: option.value }))}
                  className={`w-full rounded-[var(--radius)] border p-4 text-left transition-all ${
                    selected ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <p className="text-sm font-bold text-foreground">{option.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{option.desc}</p>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-border shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">业务盾牌</CardTitle>
            <CardDescription>用于快速阻断高风险查询，降低无效联网请求</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-2 rounded-[var(--radius)] border border-border bg-muted/25 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-bold text-foreground">启用 0 级盾牌</p>
                <p className="text-xs text-muted-foreground">开启后，数据库中等级为 0 的记录直接拦截</p>
              </div>
              <Switch
                checked={settings.enable_zero_level_shield}
                onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, enable_zero_level_shield: checked }))}
                aria-label="enable-zero-level-shield"
              />
            </div>

            <div className="space-y-2">
              <label className="ml-1 block text-sm font-bold text-foreground">活跃盾牌天数</label>
              <Input
                type="number"
                min={0}
                value={settings.active_shield_days}
                onChange={(e) => setNumericField("active_shield_days", e.target.value)}
                onBlur={() => handleNumericBlur("active_shield_days", DEFAULT_SETTINGS.active_shield_days, 0)}
                className="max-w-xs"
              />
              <p className="text-xs text-muted-foreground">当用户等级 1-10 且最近活跃在该天数内，会直接拦截查询</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">限流参数</CardTitle>
            <CardDescription>对应 rate_limit:api_quota:{'{ip}'} 计数器，按 IP 生效</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="ml-1 block text-sm font-bold text-foreground">窗口内最大查询次数</label>
              <Input
                type="number"
                min={1}
                value={settings.api_query_limit}
                onChange={(e) => setNumericField("api_query_limit", e.target.value)}
                onBlur={() => handleNumericBlur("api_query_limit", DEFAULT_SETTINGS.api_query_limit, 1)}
              />
              <p className="text-xs text-muted-foreground">超过后降级到仅数据库返回，不再请求抖音外部接口</p>
            </div>

            <div className="space-y-2">
              <label className="ml-1 block text-sm font-bold text-foreground">限流窗口 (秒)</label>
              <Input
                type="number"
                min={1}
                value={settings.api_query_window}
                onChange={(e) => setNumericField("api_query_window", e.target.value)}
                onBlur={() => handleNumericBlur("api_query_window", DEFAULT_SETTINGS.api_query_window, 1)}
              />
              <p className="text-xs text-muted-foreground">当前约 {safeWindowMinutes} 分钟一个窗口</p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="ml-1 block text-sm font-bold text-foreground">全局最大外部 API 请求数</label>
              <Input
                type="number"
                min={1}
                value={settings.global_api_query_limit}
                onChange={(e) => setNumericField("global_api_query_limit", e.target.value)}
                onBlur={() =>
                  handleNumericBlur("global_api_query_limit", DEFAULT_SETTINGS.global_api_query_limit, 1)
                }
              />
              <p className="text-xs text-muted-foreground">单窗口内全站共用的上游 API 请求总额度，超限后整体降级为数据库模式</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 rounded-[var(--radius)] border border-border bg-card p-4 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-muted-foreground">
            修改后会立即写入 Redis，`czlevel_api` 下次请求时生效，无需重启服务
          </div>
          <Button onClick={handleSave} disabled={saving} className="h-10 min-w-[160px] font-bold">
            <Save className="mr-2 h-4 w-4" />
            {saving ? "保存中..." : "保存全部配置"}
          </Button>
        </div>

        {error ? <p className="text-sm font-bold text-destructive">{error}</p> : null}
        {success ? <p className="text-sm font-bold text-primary">{success}</p> : null}
      </div>
    </div>
  );
}
