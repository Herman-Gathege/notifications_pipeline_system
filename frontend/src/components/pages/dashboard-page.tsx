import { useState, useEffect } from "react"
import { RefreshCwIcon } from "lucide-react"

import { ErrorState, Page, PageHeader, StatCard } from "@/components/page-kit"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useApi } from "@/hooks/use-api"

interface Stats {
  events: number
  notifications: number
  delivered: number
  queued: number
  failed: number
  dead_letter: number
}

export default function DashboardPage() {
  const { get } = useApi<Stats>()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchStats = async () => {
    try {
      setLoading(true)
      const data = await get("/monitoring/statistics")
      setStats(data)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load statistics")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const statCards: {
    label: string
    value: number
    tone: "neutral" | "brand" | "success" | "warning" | "danger" | "info"
  }[] = stats
    ? [
        { label: "Events", value: stats.events, tone: "neutral" },
        { label: "Notifications", value: stats.notifications, tone: "brand" },
        { label: "Delivered", value: stats.delivered, tone: "success" },
        { label: "Queued", value: stats.queued, tone: "info" },
        { label: "Failed", value: stats.failed, tone: "danger" },
        { label: "Dead letter", value: stats.dead_letter, tone: "warning" },
      ]
    : []

  const deliveryRate =
    stats && stats.notifications > 0
      ? (stats.delivered / stats.notifications) * 100
      : null

  return (
    <Page>
      <PageHeader
        title="Dashboard"
        description="Delivery health across every application, provider and channel."
        actions={
          <Button variant="outline" onClick={fetchStats} disabled={loading}>
            <RefreshCwIcon className={loading ? "animate-spin" : undefined} />
            {loading ? "Refreshing" : "Refresh"}
          </Button>
        }
      />

      {error ? <ErrorState message={error} onRetry={fetchStats} /> : null}

      {loading && !stats ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} size="sm" aria-busy="true">
              <CardContent className="pl-6">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-3 h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {statCards.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              tone={stat.tone}
            />
          ))}
        </div>
      )}

      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Delivery health</CardTitle>
            <CardDescription>
              Share of notifications by final status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.notifications > 0 ? (
              <div className="flex flex-col gap-5">
                {deliveryRate !== null && (
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b-2 border-[var(--border-soft)] pb-4">
                    <span className="stat-value">{deliveryRate.toFixed(1)}%</span>
                    <span className="text-sm text-[var(--ink-muted)]">
                      delivered of {stats.notifications.toLocaleString()}{" "}
                      notifications
                    </span>
                  </div>
                )}
                <BreakdownRow
                  label="Delivered"
                  value={stats.delivered}
                  total={stats.notifications}
                  tone="success"
                />
                <BreakdownRow
                  label="Failed"
                  value={stats.failed}
                  total={stats.notifications}
                  tone="danger"
                />
                <BreakdownRow
                  label="Dead letter"
                  value={stats.dead_letter}
                  total={stats.notifications}
                  tone="warning"
                />
              </div>
            ) : (
              <p className="text-sm text-[var(--ink-muted)]">
                No notifications yet. Publish an event to populate delivery
                metrics.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </Page>
  )
}

function BreakdownRow({
  label,
  value,
  total,
  tone,
}: {
  label: string
  value: number
  total: number
  tone: "success" | "danger" | "warning"
}) {
  const percent = total > 0 ? (value / total) * 100 : 0
  const barTone = {
    success: "bg-[var(--success)]",
    danger: "bg-[var(--destructive)]",
    warning: "bg-[var(--warning)]",
  }[tone]

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-bold text-[var(--ink)]">{label}</span>
        <span className="text-sm tabular-nums text-[var(--ink-muted)]">
          {value.toLocaleString()}
          <span className="ml-2 font-bold text-[var(--ink)]">
            {percent.toFixed(1)}%
          </span>
        </span>
      </div>
      <div
        role="presentation"
        className="h-2 w-full border-2 border-[var(--ink)] bg-surface-2"
      >
        <div
          className={`h-full ${barTone}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  )
}
