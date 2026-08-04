import { useState, useEffect } from "react"
import { useApi } from "@/hooks/use-api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

interface Notification {
  id: string
  event_id: string
  recipient: string
  channel: string
  status: string
  failure_reason: string | null
  created_at: string
  updated_at: string
}

export default function NotificationsPage() {
  const { get, post } = useApi<Notification[]>()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const data = await get("/api/v1/notifications")
      setNotifications(data)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const handleRetry = async (id: string) => {
    try {
      await post(`/api/v1/notifications/${id}/retry`, {})
      fetchNotifications()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to retry notification")
    }
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case "delivered": return "default"
      case "failed": return "destructive"
      case "queued": return "secondary"
      case "dead_letter": return "outline"
      default: return "outline"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <Button variant="outline" onClick={fetchNotifications} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {loading ? (
        <Card><CardContent className="p-4"><div className="h-8 w-full animate-pulse rounded bg-muted" /></CardContent></Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Failure Reason</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.map((notif) => (
                <TableRow key={notif.id}>
                  <TableCell className="text-xs font-mono">{notif.id.slice(0, 8)}...</TableCell>
                  <TableCell><Badge variant="outline">{notif.channel}</Badge></TableCell>
                  <TableCell className="text-xs">{notif.recipient || "—"}</TableCell>
                  <TableCell><Badge variant={statusVariant(notif.status)}>{notif.status}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{notif.failure_reason || "—"}</TableCell>
                  <TableCell className="text-xs">{new Date(notif.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    {notif.status === "failed" || notif.status === "dead_letter" ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">Retry</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Retry Notification</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to retry notification {notif.id.slice(0, 8)}...?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRetry(notif.id)}>Retry</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {notifications.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No notifications yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}