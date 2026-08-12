import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
      const data = await get("/api/v1/monitoring/statistics")
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

  const statCards = stats
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
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button variant="outline" onClick={fetchStats} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading && !stats ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="mt-2 h-8 w-16 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {statCards.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="pb-2">
                <CardDescription>{stat.label}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Delivery Rate</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.notifications > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Delivered</span>
                  <Badge variant="secondary">
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
            ) : (
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}