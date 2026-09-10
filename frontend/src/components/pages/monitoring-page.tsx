import { useState, useEffect } from "react"
import { ActivityIcon, RefreshCwIcon } from "lucide-react"

import {
  EmptyRow,
  ErrorState,
  formatTimestamp,
  Page,
  PageHeader,
  StatCard,
  TableSkeleton,
} from "@/components/page-kit"
import { useApi } from "@/hooks/use-api"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Stats {
  events: number
  notifications: number
  delivered: number
  queued: number
  failed: number
  dead_letter: number
}

interface LogEntry {
  id: string
  event_id: string
  recipient: string
  channel: string
  status: string
  provider: string
  processing_time_ms: number
  failure_reason: string | null
  created_at: string
}

export default function MonitoringPage() {
  const { get } = useApi<Stats>()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("statistics")

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

  const statItems: {
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

  return (
    <Page>
      <PageHeader
        title="Monitoring"
        description="Delivery statistics and per-attempt logs across every channel."
        actions={
          <Button variant="outline" onClick={fetchStats} disabled={loading}>
            <RefreshCwIcon className={loading ? "animate-spin" : undefined} />
            {loading ? "Refreshing" : "Refresh"}
          </Button>
        }
      />

      {error ? <ErrorState message={error} onRetry={fetchStats} /> : null}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="statistics">
          {loading && !stats ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} size="sm" aria-busy="true">
                  <div className="px-5">
                    <div className="h-3 w-24 animate-pulse bg-[var(--surface-3)]" />
                    <div className="mt-3 h-8 w-16 animate-pulse bg-[var(--surface-3)]" />
                  </div>
                </Card>
              ))}
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {statItems.map((stat) => (
                  <StatCard
                    key={stat.label}
                    label={stat.label}
                    value={stat.value}
                    tone={stat.tone}
                  />
                ))}
              </div>
            </>
          ) : null}
        </TabsContent>

        <TabsContent value="logs">
          <LogsTable />
        </TabsContent>
      </Tabs>
    </Page>
  )
}

function LogsTable() {
  const { get } = useApi<LogEntry[]>()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const data = await get("/monitoring/logs")
      setLogs(data)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load logs")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  if (loading && logs.length === 0) {
    return <TableSkeleton columns={7} label="Loading logs" />
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchLogs} />
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Channel</TableHead>
            <TableHead>Recipient</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Time (ms)</TableHead>
            <TableHead>Failure</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell><Badge variant="secondary">{log.channel}</Badge></TableCell>
              <TableCell>
                <div className="cell-truncate text-xs" title={log.recipient || undefined}>
                  {log.recipient || "—"}
                </div>
              </TableCell>
              <TableCell><Badge variant={log.status === "delivered" ? "success" : log.status === "failed" ? "destructive" : "secondary"}>{log.status}</Badge></TableCell>
              <TableCell className="text-xs uppercase tracking-wide text-[var(--ink-muted)]">
                {log.provider}
              </TableCell>
              <TableCell className="text-xs tabular-nums">
                {log.processing_time_ms}
              </TableCell>
              <TableCell>
                <div
                  className="cell-truncate max-w-[180px] text-xs text-[var(--ink-muted)]"
                  title={log.failure_reason || undefined}
                >
                  {log.failure_reason || "—"}
                </div>
              </TableCell>
              <TableCell className="text-xs whitespace-nowrap text-[var(--ink-muted)]">
                {formatTimestamp(log.created_at)}
              </TableCell>
            </TableRow>
          ))}
          {logs.length === 0 && (
            <EmptyRow
              colSpan={7}
              icon={ActivityIcon}
              title="No logs available"
              description="Delivery attempts are logged here as soon as traffic starts flowing."
            />
          )}
        </TableBody>
      </Table>
    </Card>
  )
}
