import { useState, useEffect } from "react"
import { BellIcon, RefreshCwIcon } from "lucide-react"

import {
  EmptyRow,
  ErrorState,
  Page,
  PageHeader,
  TableSkeleton,
} from "@/components/page-kit"
import { formatTimestamp } from "@/lib/format"
import { useApi } from "@/hooks/use-api"
import { Card } from "@/components/ui/card"
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
      const data = await get("/notifications")
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
      await post(`/notifications/${id}/retry`, {})
      fetchNotifications()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to retry notification")
    }
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case "delivered": return "success"
      case "failed": return "destructive"
      case "queued": return "secondary"
      case "dead_letter": return "warning"
      case "sent": return "info"
      default: return "outline"
    }
  }

  return (
    <Page>
      <PageHeader
        title="Notifications"
        description="Every delivery attempt, with retry for anything that failed."
        actions={
          <Button variant="outline" onClick={fetchNotifications} disabled={loading}>
            <RefreshCwIcon className={loading ? "animate-spin" : undefined} />
            {loading ? "Refreshing" : "Refresh"}
          </Button>
        }
      />

      {error ? <ErrorState message={error} onRetry={fetchNotifications} /> : null}

      {loading ? (
        <TableSkeleton columns={7} label="Loading notifications" />
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.map((notif) => (
                <TableRow key={notif.id}>
                  <TableCell className="font-mono text-xs text-[var(--ink-muted)]">
                    {notif.id.slice(0, 8)}…
                  </TableCell>
                  <TableCell><Badge variant="secondary">{notif.channel}</Badge></TableCell>
                  <TableCell>
                    <div className="cell-truncate max-w-[180px] text-xs" title={notif.recipient || undefined}>
                      {notif.recipient || "—"}
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={statusVariant(notif.status)}>{notif.status.replace("_", " ")}</Badge></TableCell>
                  <TableCell>
                    <div
                      className="cell-truncate max-w-[170px] text-xs text-[var(--ink-muted)]"
                      title={notif.failure_reason || undefined}
                    >
                      {notif.failure_reason || "—"}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap text-[var(--ink-muted)]">
                    {formatTimestamp(notif.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    {notif.status === "failed" || notif.status === "dead_letter" ? (
                      <AlertDialog>
                        <AlertDialogTrigger render={<Button variant="outline" size="sm" className="ml-auto" />}>
                          Retry
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Retry notification</AlertDialogTitle>
                            <AlertDialogDescription>
                              This re-queues notification {notif.id.slice(0, 8)}… for delivery.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRetry(notif.id)}>Retry</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <span className="text-xs text-[var(--ink-faint)]">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {notifications.length === 0 && (
                <EmptyRow
                  colSpan={7}
                  icon={BellIcon}
                  title="No notifications yet"
                  description="Notifications appear here once a published event fans out to a channel."
                />
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </Page>
  )
}
