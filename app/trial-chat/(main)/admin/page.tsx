"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface DailyPoint {
  date: string;
  count: number;
}

interface StatsData {
  total: number;
  daily: DailyPoint[];
  byType: Record<string, number>;
  byRole: Record<string, number>;
  byCta: Record<string, number>;
  byIntent: Record<string, number>;
  topUrls: { url: string; count: number }[];
}

const DAY_OPTIONS = [7, 14, 30] as const;
type DayOption = (typeof DAY_OPTIONS)[number];

function BreakdownBar({
  label,
  count,
  max,
  color = "bg-blue-500 dark:bg-blue-400",
}: {
  label: string;
  count: number;
  max: number;
  color?: string;
}) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-24 shrink-0 truncate text-slate-500 dark:text-slate-400 text-xs">
        {label}
      </span>
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-7 text-right font-mono text-xs text-slate-600 dark:text-slate-300 tabular-nums">
        {count}
      </span>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-5 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
        {label}
      </p>
      <p className="text-3xl font-bold text-slate-800 dark:text-white tabular-nums">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

export default function AdminPage() {
  const [days, setDays] = useState<DayOption>(30);
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/link-events?days=${days}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json() as StatsData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const maxDaily = data ? Math.max(...data.daily.map((d) => d.count), 1) : 1;
  const maxType = data ? Math.max(...Object.values(data.byType), 1) : 1;
  const maxRole = data ? Math.max(...Object.values(data.byRole), 1) : 1;
  const maxCta = data ? Math.max(...Object.values(data.byCta), 1) : 1;
  const maxIntent = data ? Math.max(...Object.values(data.byIntent ?? {}), 1) : 1;

  return (
    <div className="h-full w-full overflow-y-auto custom-scrollbar scroll-mask">
      <div className="mx-auto max-w-4xl px-6 py-10">

        {/* ── Header ── */}
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <Link
              href="/trial-chat"
              className="mb-3 inline-flex items-center text-xs text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
            >
              <svg className="mr-1.5 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              Link Analytics
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              External click events via <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">/r</code> redirect
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh */}
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-all disabled:opacity-40"
              title="Refresh"
            >
              <svg
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>

            {/* Day selector */}
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 gap-1">
              {DAY_OPTIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    days === d
                      ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white ring-1 ring-black/5 dark:ring-white/10"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-4 text-sm text-red-600 dark:text-red-400">
            Error: {error}
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {loading && !data && (
          <div className="space-y-4 animate-pulse">
            <div className="h-28 rounded-xl bg-slate-100 dark:bg-slate-800/60" />
            <div className="h-44 rounded-xl bg-slate-100 dark:bg-slate-800/60" />
            <div className="grid grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-32 rounded-xl bg-slate-100 dark:bg-slate-800/60" />
              ))}
            </div>
            <div className="h-48 rounded-xl bg-slate-100 dark:bg-slate-800/60" />
          </div>
        )}

        {/* ── Data ── */}
        {data && (
          <div className={`space-y-5 transition-opacity duration-200 ${loading ? "opacity-50 pointer-events-none" : "opacity-100"}`}>

            {/* Total */}
            <StatCard label={`Total clicks · last ${days} days`} value={data.total} />

            {/* Daily bar chart */}
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-6 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
                Clicks per Day
              </p>

              {data.total === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No clicks recorded yet</p>
              ) : (
                <>
                  <div className="flex items-end gap-[2px] h-20">
                    {data.daily.map(({ date, count }) => {
                      const pct = maxDaily > 0 ? Math.max((count / maxDaily) * 100, count > 0 ? 5 : 0) : 0;
                      return (
                        <div
                          key={date}
                          className="flex-1 flex flex-col items-center justify-end group cursor-default"
                          title={`${date}: ${count}`}
                        >
                          <div
                            className="w-full rounded-t-[2px] bg-blue-400 dark:bg-blue-500 group-hover:bg-blue-500 dark:group-hover:bg-blue-400 transition-all duration-200"
                            style={{ height: `${pct}%`, minHeight: count > 0 ? "3px" : "0" }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  {data.daily.length > 0 && (
                    <div className="flex justify-between mt-2 text-[9px] text-slate-400 tabular-nums">
                      <span>{data.daily[0]?.date.slice(5)}</span>
                      <span>{data.daily[Math.floor(data.daily.length / 2)]?.date.slice(5)}</span>
                      <span>{data.daily[data.daily.length - 1]?.date.slice(5)}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Breakdown cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* By Type */}
              <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-5 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                  By Type
                </p>
                <div className="space-y-2.5">
                  {Object.entries(data.byType)
                    .sort(([, a], [, b]) => b - a)
                    .map(([k, v]) => (
                      <BreakdownBar key={k} label={k} count={v} max={maxType} color="bg-blue-500 dark:bg-blue-400" />
                    ))}
                  {Object.keys(data.byType).length === 0 && (
                    <p className="text-xs text-slate-400">No data</p>
                  )}
                </div>
              </div>

              {/* By Role */}
              <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-5 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                  By Role
                </p>
                <div className="space-y-2.5">
                  {Object.entries(data.byRole)
                    .sort(([, a], [, b]) => b - a)
                    .map(([k, v]) => (
                      <BreakdownBar key={k} label={k} count={v} max={maxRole} color="bg-violet-500 dark:bg-violet-400" />
                    ))}
                  {Object.keys(data.byRole).length === 0 && (
                    <p className="text-xs text-slate-400">No data</p>
                  )}
                </div>
              </div>

              {/* By CTA */}
              <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-5 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                  By CTA
                </p>
                <div className="space-y-2.5">
                  {Object.entries(data.byCta)
                    .sort(([, a], [, b]) => b - a)
                    .map(([k, v]) => (
                      <BreakdownBar key={k} label={k} count={v} max={maxCta} color="bg-emerald-500 dark:bg-emerald-400" />
                    ))}
                  {Object.keys(data.byCta).length === 0 && (
                    <p className="text-xs text-slate-400">No data</p>
                  )}
                </div>
              </div>

              {/* By Intent */}
              <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-5 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                  By Intent
                </p>
                <div className="space-y-2.5">
                  {Object.entries(data.byIntent ?? {})
                    .sort(([, a], [, b]) => b - a)
                    .map(([k, v]) => (
                      <BreakdownBar key={k} label={k} count={v} max={maxIntent} color="bg-amber-500 dark:bg-amber-400" />
                    ))}
                  {Object.keys(data.byIntent ?? {}).length === 0 && (
                    <p className="text-xs text-slate-400">No data</p>
                  )}
                </div>
              </div>
            </div>

            {/* Top URLs */}
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-6 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
                Top URLs
              </p>
              {data.topUrls.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No data yet</p>
              ) : (
                <div className="space-y-2.5">
                  {data.topUrls.map(({ url, count }, i) => (
                    <div key={url} className="flex items-center gap-3 text-xs group">
                      <span className="w-4 shrink-0 text-center font-mono text-slate-400">{i + 1}</span>
                      <span className="flex-1 truncate font-mono text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        {url}
                      </span>
                      <span className="shrink-0 font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
