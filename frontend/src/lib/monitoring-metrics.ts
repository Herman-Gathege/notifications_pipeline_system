/**
 * Monitoring analytics.
 *
 * Everything here is derived from the data the API already exposes —
 * `/monitoring/logs` (the most recent delivery attempts) and
 * `/monitoring/statistics` (all-time totals). No backend metrics are invented.
 *
 * The logs endpoint returns the latest 100 notifications, so every
 * distribution below is scoped to that window. Callers surface that in the UI.
 */

export interface MonitoringLog {
  id: string
  event_id: string
  recipient: string
  channel: string
  status: string
  provider: string | null
  processing_time_ms: number | null
  failure_reason: string | null
  created_at: string
}

export interface DailyPoint {
  key: string
  /** Axis label: weekday for short ranges, "Sep 8" for longer ones. */
  label: string
  /** Full label used by tooltips. */
  fullLabel: string
  date: Date
  delivered: number
  /** Failed + dead letter — everything that did not reach the recipient. */
  failed: number
  total: number
}

export interface ChannelSlice {
  channel: string
  label: string
  count: number
  share: number
}

export interface ProviderStat {
  provider: string
  total: number
  delivered: number
  failed: number
  successRate: number
  avgMs: number | null
}

export const MAX_PROVIDERS = 6

type Named = { label: string; value: number }

/* ------------------------------------------------------------------ */
/*  Formatting helpers                                                 */
/* ------------------------------------------------------------------ */

export function formatCount(value: number): string {
  return value.toLocaleString()
}

export function formatCompactCount(value: number): string {
  if (Math.abs(value) >= 1000) {
    const compact = value / 1000
    return `${compact % 1 === 0 ? compact : compact.toFixed(1)}k`
  }
  return `${value}`
}

export function formatPercent(ratio: number, digits = 0): string {
  return `${(ratio * 100).toFixed(digits)}%`
}

export function formatDuration(ms: number | null): string {
  if (ms === null || Number.isNaN(ms)) return "—"
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export function titleCase(value: string): string {
  if (!value) return "Unknown"
  return value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

/* ------------------------------------------------------------------ */
/*  Time series                                                        */
/* ------------------------------------------------------------------ */

function startOfDay(date: Date): Date {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function dayKey(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

/**
 * Buckets delivery attempts into one point per calendar day, zero-filling
 * days without traffic so the trend line reflects real gaps.
 */
export function buildDailySeries(
  logs: MonitoringLog[],
  days: number,
  now: Date = new Date()
): DailyPoint[] {
  const end = startOfDay(now)
  const start = addDays(end, -(days - 1))

  const points: DailyPoint[] = []
  const byKey = new Map<string, DailyPoint>()

  for (let i = 0; i < days; i += 1) {
    const date = addDays(start, i)
    const point: DailyPoint = {
      key: dayKey(date),
      label:
        days <= 7
          ? date.toLocaleDateString(undefined, { weekday: "short" })
          : date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      fullLabel: date.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      date,
      delivered: 0,
      failed: 0,
      total: 0,
    }
    points.push(point)
    byKey.set(point.key, point)
  }

  for (const log of logs) {
    const date = new Date(log.created_at)
    if (Number.isNaN(date.getTime())) continue
    const point = byKey.get(dayKey(date))
    if (!point) continue

    point.total += 1
    if (log.status === "delivered") {
      point.delivered += 1
    } else if (log.status === "failed" || log.status === "dead_letter") {
      point.failed += 1
    }
  }

  return points
}

export interface SeriesSummary {
  total: number
  delivered: number
  failed: number
  successRate: number
  peak: DailyPoint | null
  activeDays: number
}

export function summariseSeries(points: DailyPoint[]): SeriesSummary {
  let total = 0
  let delivered = 0
  let failed = 0
  let peak: DailyPoint | null = null
  let activeDays = 0

  for (const point of points) {
    total += point.total
    delivered += point.delivered
    failed += point.failed
    if (point.total > 0) activeDays += 1
    if (!peak || point.total > peak.total) peak = point
  }

  return {
    total,
    delivered,
    failed,
    successRate: total > 0 ? delivered / total : 0,
    peak: peak && peak.total > 0 ? peak : null,
    activeDays,
  }
}

export function logsWithinRange(
  logs: MonitoringLog[],
  days: number,
  now: Date = new Date()
): MonitoringLog[] {
  const start = addDays(startOfDay(now), -(days - 1)).getTime()
  return logs.filter((log) => {
    const time = new Date(log.created_at).getTime()
    return !Number.isNaN(time) && time >= start
  })
}

/* ------------------------------------------------------------------ */
/*  Distributions                                                      */
/* ------------------------------------------------------------------ */

/**
 * Where traffic goes: attempts per channel, largest first.
 */
export function buildChannelBreakdown(logs: MonitoringLog[]): ChannelSlice[] {
  const counts = new Map<string, number>()
  for (const log of logs) {
    const channel = log.channel || "unknown"
    counts.set(channel, (counts.get(channel) ?? 0) + 1)
  }

  const total = logs.length
  return [...counts.entries()]
    .map(([channel, count]) => ({
      channel,
      label: titleCase(channel),
      count,
      share: total > 0 ? count / total : 0,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

/**
 * How each provider is performing: volume, delivery success and latency.
 * Providers are ranked by volume so the busiest routes read first.
 */
export function buildProviderStats(logs: MonitoringLog[]): ProviderStat[] {
  const stats = new Map<
    string,
    {
      provider: string
      total: number
      delivered: number
      failed: number
      msSum: number
      msCount: number
    }
  >()

  for (const log of logs) {
    const provider = log.provider?.trim() || "Unassigned"
    const entry =
      stats.get(provider) ??
      {
        provider,
        total: 0,
        delivered: 0,
        failed: 0,
        msSum: 0,
        msCount: 0,
      }

    entry.total += 1
    if (log.status === "delivered") entry.delivered += 1
    if (log.status === "failed" || log.status === "dead_letter") entry.failed += 1
    if (typeof log.processing_time_ms === "number") {
      entry.msSum += log.processing_time_ms
      entry.msCount += 1
    }

    stats.set(provider, entry)
  }

  return [...stats.values()]
    .map((entry) => ({
      provider: entry.provider,
      total: entry.total,
      delivered: entry.delivered,
      failed: entry.failed,
      successRate: entry.total > 0 ? entry.delivered / entry.total : 0,
      avgMs: entry.msCount > 0 ? entry.msSum / entry.msCount : null,
    }))
    .sort((a, b) => b.total - a.total || a.provider.localeCompare(b.provider))
}

/**
 * Largest remainder ordering for the "all other providers" bucket.
 */
export function topProviders(
  stats: ProviderStat[],
  limit = MAX_PROVIDERS
): { shown: ProviderStat[]; hiddenCount: number; hiddenAttempts: number } {
  if (stats.length <= limit) {
    return { shown: stats, hiddenCount: 0, hiddenAttempts: 0 }
  }

  const shown = stats.slice(0, limit)
  const hidden = stats.slice(limit)
  return {
    shown,
    hiddenCount: hidden.length,
    hiddenAttempts: hidden.reduce((sum, item) => sum + item.total, 0),
  }
}

/* ------------------------------------------------------------------ */
/*  Ranked helpers used by the KPI strip                               */
/* ------------------------------------------------------------------ */

export function highestBy(items: ChannelSlice[]): Named | null {
  if (items.length === 0) return null
  const top = items.reduce((best, item) => (item.count > best.count ? item : best))
  return top.count > 0 ? { label: top.label, value: top.count } : null
}
