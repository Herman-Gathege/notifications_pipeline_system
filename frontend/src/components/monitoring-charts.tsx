import { useMemo, useState } from "react"
import { Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts"
import {
  ActivityIcon,
  BarChart3Icon,
  ServerIcon,
  type LucideIcon,
} from "lucide-react"

import { ErrorState } from "@/components/page-kit"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import {
  buildChannelBreakdown,
  buildTimeSeries,
  buildProviderStats,
  DEFAULT_RANGE_ID,
  formatCompactCount,
  formatCount,
  formatDuration,
  formatPercent,
  getRangePreset,
  RANGE_PRESETS,
  summariseSeries,
  topProviders,
  type MonitoringLog,
} from "@/lib/monitoring-metrics"
import { cn } from "@/lib/utils"

/** The logs endpoint returns the latest 100 attempts; we flag when capped. */
const LOG_WINDOW = 100

const trendConfig = {
  delivered: { label: "Delivered", color: "var(--brand-orange)" },
  failed: { label: "Failed", color: "var(--chart-contrast)" },
} satisfies ChartConfig

/* ------------------------------------------------------------------ */
/*  Shared pieces                                                      */
/* ------------------------------------------------------------------ */

function ChartSkeleton({ className }: { className?: string }) {
  const heights = ["42%", "68%", "54%", "86%", "62%", "96%", "74%", "50%"]
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={cn("flex items-end gap-2 sm:gap-3", className)}
    >
      <span className="sr-only">Loading chart</span>
      {heights.map((height, index) => (
        <Skeleton
          key={index}
          className="w-full"
          style={{ height }}
        />
      ))}
    </div>
  )
}

function CardEmptyState({
  icon: Icon,
  title,
  description,
  className,
}: {
  icon: LucideIcon
  title: string
  description: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-center",
        className
      )}
    >
      <span className="flex size-12 items-center justify-center border-2 border-[var(--border-mid)] bg-surface-2 text-[var(--ink-muted)]">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-black uppercase tracking-[0.06em] text-[var(--ink)]">
          {title}
        </p>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-[var(--ink-muted)]">
          {description}
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Primary: delivery activity trend                                   */
/* ------------------------------------------------------------------ */

export function DeliveryTrendCard({
  logs,
  loading,
  error,
  onRetry,
}: {
  logs: MonitoringLog[]
  loading: boolean
  error: string
  onRetry: () => void
}) {
  const [rangeId, setRangeId] = useState(DEFAULT_RANGE_ID)
  const preset = getRangePreset(rangeId)

  const points = useMemo(
    () => buildTimeSeries(logs, preset),
    [logs, preset]
  )
  const summary = useMemo(() => summariseSeries(points), [points])

  const showDots = points.length <= 14
  const isEmpty = !loading && !error && summary.total === 0
  const capped = logs.length >= LOG_WINDOW

  return (
    <Card>
      <CardHeader className="gap-4 sm:flex sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <CardTitle>Delivery activity</CardTitle>
          <CardDescription>
            Delivered versus failed attempts{" "}
            {preset.granularity === "month" ? "per month" : "per day"}.
          </CardDescription>
        </div>
        <div
          role="group"
          aria-label="Chart time range"
          className="inline-flex w-fit shrink-0 border-2 border-[var(--ink)] bg-surface-1"
        >
          {RANGE_PRESETS.map((option, index) => {
            const active = option.id === rangeId
            return (
              <button
                key={option.id}
                type="button"
                title={option.title}
                aria-pressed={active}
                onClick={() => setRangeId(option.id)}
                className={cn(
                  "h-9 px-2.5 text-[11px] font-black tracking-[0.06em] uppercase transition-colors sm:px-3",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-orange)]",
                  index > 0 && "border-l-2 border-[var(--ink)]",
                  active
                    ? "bg-[var(--ink)] text-white"
                    : "text-[var(--ink-muted)] hover:bg-surface-2 hover:text-[var(--ink)]"
                )}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </CardHeader>

      <CardContent>
        {error ? (
          <ErrorState
            title="Unable to load performance data"
            message={error}
            onRetry={onRetry}
          />
        ) : loading ? (
          <ChartSkeleton className="h-[240px] sm:h-[280px]" />
        ) : isEmpty ? (
          <CardEmptyState
            icon={ActivityIcon}
            title="No activity in this period"
            description={`Delivery activity will appear here once events are processed in the ${preset.title.toLowerCase()}.`}
            className="h-[240px] sm:h-[280px]"
          />
        ) : (
          <>
            <ChartContainer
              config={trendConfig}
              role="img"
              aria-label={`Delivery activity for the ${preset.title.toLowerCase()}: ${formatCount(
                summary.delivered
              )} delivered and ${formatCount(summary.failed)} failed attempts.`}
              className="aspect-auto h-[240px] w-full sm:h-[280px]"
            >
              <ComposedChart
                data={points}
                margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
              >
                <defs>
                  <linearGradient
                    id="monitoring-delivered-fill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="var(--color-delivered)"
                      stopOpacity={0.16}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--color-delivered)"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="var(--border-soft)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  minTickGap={16}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={38}
                  allowDecimals={false}
                  tickFormatter={formatCompactCount}
                />
                <ChartTooltip
                  cursor={{ stroke: "var(--border-mid)", strokeWidth: 2 }}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_, payload) =>
                        (payload?.[0]?.payload as { fullLabel?: string })
                          ?.fullLabel ?? ""
                      }
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="delivered"
                  isAnimationActive={false}
                  stroke="var(--color-delivered)"
                  strokeWidth={2.5}
                  fill="url(#monitoring-delivered-fill)"
                  dot={showDots ? { r: 2.5, strokeWidth: 0 } : false}
                  activeDot={{
                    r: 4,
                    strokeWidth: 2,
                    stroke: "var(--surface-1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="failed"
                  isAnimationActive={false}
                  stroke="var(--color-failed)"
                  strokeWidth={2}
                  dot={showDots ? { r: 2.5, strokeWidth: 0 } : false}
                  activeDot={{
                    r: 4,
                    strokeWidth: 2,
                    stroke: "var(--surface-1)",
                  }}
                />
              </ComposedChart>
            </ChartContainer>

            {/* Screen-reader equivalent of the trend line */}
            <p className="sr-only">
              {formatCount(summary.delivered)} delivered and{" "}
              {formatCount(summary.failed)} failed attempts across{" "}
              {summary.activeDays} active{" "}
              {summary.activeDays === 1 ? "day" : "days"}.
              {summary.peak
                ? ` Busiest day was ${summary.peak.fullLabel} with ${formatCount(
                    summary.peak.total
                  )} attempts.`
                : ""}
            </p>
          </>
        )}
      </CardContent>

      {!error && !loading && !isEmpty ? (
        <CardFooter className="flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <dl className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <TrendStat label="Attempts" value={formatCount(summary.total)} />
            <TrendStat
              label="Delivered"
              value={formatCount(summary.delivered)}
            />
            <TrendStat label="Failed" value={formatCount(summary.failed)} />
            <TrendStat
              label="Success rate"
              value={formatPercent(summary.successRate, 1)}
            />
          </dl>
          <p className="text-[11px] leading-relaxed text-[var(--ink-muted)]">
            {summary.peak
              ? `${preset.granularity === "month" ? "Busiest month" : "Busiest day"} ${summary.peak.label} · ${formatCount(summary.peak.total)} attempts`
              : null}
            {capped ? (
              <span className="block text-[var(--ink-faint)]">
                Based on the latest {LOG_WINDOW} delivery attempts
              </span>
            ) : null}
          </p>
        </CardFooter>
      ) : null}
    </Card>
  )
}

function TrendStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--ink-muted)]">
        {label}
      </dt>
      <dd className="text-sm font-black tabular-nums text-[var(--ink)]">
        {value}
      </dd>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Secondary: where traffic goes                                      */
/* ------------------------------------------------------------------ */

export function TrafficBreakdownCard({
  logs,
  loading,
  error,
  onRetry,
}: {
  logs: MonitoringLog[]
  loading: boolean
  error: string
  onRetry: () => void
}) {
  const slices = useMemo(() => buildChannelBreakdown(logs), [logs])
  const total = slices.reduce((sum, slice) => sum + slice.count, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Traffic by channel</CardTitle>
        <CardDescription>
          Share of delivery attempts per channel.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <ErrorState
            title="Unable to load channel data"
            message={error}
            onRetry={onRetry}
          />
        ) : loading ? (
          <div className="flex flex-col gap-5" aria-busy="true">
            {[0, 1, 2].map((row) => (
              <div key={row} className="flex flex-col gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        ) : slices.length === 0 ? (
          <CardEmptyState
            icon={BarChart3Icon}
            title="No traffic yet"
            description="Channel usage appears once notifications are sent."
            className="py-10"
          />
        ) : (
          <ul className="flex flex-col gap-5">
            {slices.map((slice) => (
              <li key={slice.channel} className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="truncate text-sm font-bold text-[var(--ink)]">
                    {slice.label}
                  </span>
                  <span className="shrink-0 text-sm tabular-nums text-[var(--ink-muted)]">
                    {formatCount(slice.count)}
                    <span className="ml-2 font-black text-[var(--ink)]">
                      {formatPercent(slice.share)}
                    </span>
                  </span>
                </div>
                <div className="h-2 w-full border-2 border-[var(--ink)] bg-surface-2">
                  <div
                    className="h-full bg-[var(--brand-orange)]"
                    style={{ width: `${Math.max(slice.share * 100, 1.5)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      {!error && !loading && slices.length > 0 ? (
        <CardFooter className="justify-between gap-4">
          <span className="text-[11px] font-black uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            {formatCount(total)} attempts
          </span>
          <span className="text-[11px] text-[var(--ink-muted)]">
            {slices[0].label} leads with {formatPercent(slices[0].share)}
          </span>
        </CardFooter>
      ) : null}
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/*  Supporting: provider performance                                   */
/* ------------------------------------------------------------------ */

export function ProviderPerformanceCard({
  logs,
  loading,
  error,
  onRetry,
}: {
  logs: MonitoringLog[]
  loading: boolean
  error: string
  onRetry: () => void
}) {
  const stats = useMemo(() => buildProviderStats(logs), [logs])
  const { shown, hiddenCount, hiddenAttempts } = useMemo(
    () => topProviders(stats),
    [stats]
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Provider performance</CardTitle>
        <CardDescription>
          Delivery success and average processing time per provider.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <ErrorState
            title="Unable to load provider data"
            message={error}
            onRetry={onRetry}
          />
        ) : loading ? (
          <div className="flex flex-col divide-y-2 divide-[var(--border-soft)]" aria-busy="true">
            {[0, 1, 2].map((row) => (
              <div
                key={row}
                className="flex items-center justify-between gap-4 py-3.5"
              >
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-14" />
              </div>
            ))}
          </div>
        ) : shown.length === 0 ? (
          <CardEmptyState
            icon={ServerIcon}
            title="No provider activity"
            description="Provider metrics appear once notifications are routed."
            className="py-10"
          />
        ) : (
          <ul className="flex flex-col divide-y-2 divide-[var(--border-soft)]">
            {shown.map((stat) => (
              <li
                key={stat.provider}
                className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p
                    className="truncate text-sm font-bold text-[var(--ink)]"
                    title={stat.provider}
                  >
                    {stat.provider}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                    {formatCount(stat.total)}{" "}
                    {stat.total === 1 ? "attempt" : "attempts"} · avg{" "}
                    {formatDuration(stat.avgMs)}
                  </p>
                </div>
                <Badge
                  variant={successTone(stat.successRate)}
                  title={`${formatPercent(stat.successRate, 1)} delivered, ${formatCount(
                    stat.failed
                  )} failed`}
                  className="shrink-0"
                >
                  {formatPercent(stat.successRate)}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      {!error && !loading && hiddenCount > 0 ? (
        <CardFooter>
          <span className="text-[11px] text-[var(--ink-muted)]">
            {hiddenCount} more {hiddenCount === 1 ? "provider" : "providers"} ·{" "}
            {formatCount(hiddenAttempts)} attempts
          </span>
        </CardFooter>
      ) : null}
    </Card>
  )
}

function successTone(rate: number): "success" | "warning" | "destructive" {
  if (rate >= 0.98) return "success"
  if (rate >= 0.9) return "warning"
  return "destructive"
}
