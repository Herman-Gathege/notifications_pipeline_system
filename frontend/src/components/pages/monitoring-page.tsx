import { useState, useEffect } from "react"
import { useApi } from "@/hooks/use-api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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

  const statItems = stats
    ? [
        { label: "Total Events", value: stats.events, color: "text-blue-600" },
        { label: "Total Notifications", value: stats.notifications, color: "text-purple-600" },
        { label: "Delivered", value: stats.delivered, color: "text-green-600" },
        { label: "Queued", value: stats.queued, color: "text-yellow-600" },
        { label: "Failed", value: stats.failed, color: "text-red-600" },
        { label: "Dead Letter", value: stats.dead_letter, color: "text-orange-600" },
      ]
    : []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Monitoring</h1>
        <Button variant="outline" onClick={fetchStats} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="statistics">
          {loading && !stats ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}><CardContent className="p-4"><div className="h-4 w-24 animate-pulse rounded bg-muted" /><div className="mt-2 h-8 w-16 animate-pulse rounded bg-muted" /></CardContent></Card>
              ))}
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {statItems.map((stat) => (
                  <Card key={stat.label}>
                    <CardHeader className="pb-2"><CardDescription>{stat.label}</CardDescription></CardHeader>
                    <CardContent><div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div></CardContent>
                  </Card>
                ))}
              </div>
              {/* {stats.notifications > 0 && (
                  <Card className="mt-6">
                  <CardHeader><CardTitle>Delivery Breakdown</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Delivered</span>
                        <Badge variant="default">{((stats.delivered / stats.notifications) * 100).toFixed(1)}%</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Failed</span>
                        <Badge variant="destructive">{((stats.failed / stats.notifications) * 100).toFixed(1)}%</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Dead Letter</span>
                        <Badge variant="outline">{((stats.dead_letter / stats.notifications) * 100).toFixed(1)}%</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )} */}

              {stats.notifications > 0 && (
                <Card className="mt-6">
                  <CardHeader className="pb-4">
                    <CardTitle>Delivery Breakdown</CardTitle>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>Delivered</span>
                        <Badge variant="default">
                          {((stats.delivered / stats.notifications) * 100).toFixed(1)}%
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span>Failed</span>
                        <Badge variant="destructive">
                          {((stats.failed / stats.notifications) * 100).toFixed(1)}%
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span>Dead Letter</span>
                        <Badge variant="outline">
                          {((stats.dead_letter / stats.notifications) * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}
        </TabsContent>

        <TabsContent value="logs">
          <LogsTable />
        </TabsContent>
      </Tabs>
    </div>
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
    return <Card><CardContent className="p-4"><div className="h-8 w-full animate-pulse rounded bg-muted" /></CardContent></Card>
  }

  if (error) {
    return <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
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
              <TableCell><Badge variant="outline">{log.channel}</Badge></TableCell>
              <TableCell className="text-xs">{log.recipient || "—"}</TableCell>
              <TableCell><Badge variant={log.status === "delivered" ? "default" : log.status === "failed" ? "destructive" : "secondary"}>{log.status}</Badge></TableCell>
              <TableCell className="text-xs">{log.provider}</TableCell>
              <TableCell className="text-xs">{log.processing_time_ms}</TableCell>
              <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{log.failure_reason || "—"}</TableCell>
              <TableCell className="text-xs">{new Date(log.created_at).toLocaleString()}</TableCell>
            </TableRow>
          ))}
          {logs.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No logs available</TableCell></TableRow>}
        </TableBody>
      </Table>
    </Card>
  )
}