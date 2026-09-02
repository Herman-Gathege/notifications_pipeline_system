import { useState, useEffect } from "react"
import { useApi } from "@/hooks/use-api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Application {
  id: string
  name: string
}

interface Event {
  id: string
  application_id: string
  event_type: string
  payload: Record<string, unknown>
  status: string
  is_processed: boolean
  created_at: string
}

interface EventCreateData {
  event_type: string
  payload: string
  channels: string
  application_id?: string
}

const DEFAULT_EVENT_TYPES = ["payment.success", "user.registered", "password.reset", "otp.requested"]

const DEFAULT_EVENT_PAYLOAD_EXAMPLES: Record<string, string> = {
  "payment.success": JSON.stringify({ customer: "Alice", email: "alice@example.com", phone: "+254700000000", amount: "KES 5,250" }, null, 2),
  "user.registered": JSON.stringify({ name: "Bob", email: "bob@example.com" }, null, 2),
  "password.reset": JSON.stringify({ email: "alice@example.com" }, null, 2),
  "otp.requested": JSON.stringify({ phone: "+254700000000", otp: "123456" }, null, 2),
}

export default function EventsPage() {
  const { get, post } = useApi<Event[]>()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [publishOpen, setPublishOpen] = useState(false)
  const [publishData, setPublishData] = useState<EventCreateData>({
    event_type: DEFAULT_EVENT_TYPES[0],
    payload: DEFAULT_EVENT_PAYLOAD_EXAMPLES["payment.success"],
    channels: "email",
  })
  const [publishResult, setPublishResult] = useState<string | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [selectedAppId, setSelectedAppId] = useState<string>("")
  const [eventTypes, setEventTypes] = useState<string[]>([])

  const fetchEventTypes = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) return

      const rawBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8001"
      const API_BASE = rawBase.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "")
      const response = await fetch(`${API_BASE}/api/v1/templates/event-types`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data) && data.length > 0) {
          setEventTypes(data)
        }
      }
    } catch {
      // ignore
    }
  }

  const effectiveEventTypes = eventTypes.length > 0 ? eventTypes : DEFAULT_EVENT_TYPES
  const effectivePayloadExamples = eventTypes.length > 0
    ? Object.fromEntries(
        eventTypes.map((et) => [
          et,
          DEFAULT_EVENT_PAYLOAD_EXAMPLES[et] || JSON.stringify({ data: "{}" }, null, 2),
        ])
      )
    : DEFAULT_EVENT_PAYLOAD_EXAMPLES

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const data = await get("/events")
      setEvents(data)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events")
    } finally {
      setLoading(false)
    }
  }

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      const authUser = localStorage.getItem("auth_user")
      if (!token || !authUser) return

      const rawBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8001"
      const API_BASE = rawBase.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "")
      const response = await fetch(`${API_BASE}/api/v1/applications`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) return
      const data = await response.json()
      setApplications(data)
      if (data.length > 0 && !selectedAppId) {
        setSelectedAppId(data[0].id)
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchEvents()
    fetchApplications()
    fetchEventTypes()
  }, [])

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault()
    setPublishResult(null)
    try {
      const payload = JSON.parse(publishData.payload)
      const channels = publishData.channels.split(",").map((c) => c.trim()).filter(Boolean)
      const body: Record<string, unknown> = { event_type: publishData.event_type, payload, channels }
      if (selectedAppId) {
        body.application_id = selectedAppId
      }
      await post("/events", body)
      setPublishResult("Event published successfully!")
      setPublishData({ event_type: effectiveEventTypes[0], payload: effectivePayloadExamples[effectiveEventTypes[0]] || '{}', channels: "email" })
      setPublishOpen(false)
      fetchEvents()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to publish event"
      if (message.includes("application_id")) {
        setError("Please select an application before publishing the event.")
      } else if (message.includes("payload")) {
        setError(`Payload validation failed: ${message}`)
      } else if (message.includes("token") || message.includes("Authorization")) {
        setError("Your session has expired or is invalid. Please sign in again.")
      } else {
        setError(message)
      }
      setPublishResult(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Events</h1>
        <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
          <DialogTrigger render={<Button />}>
            Publish Event
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Publish Event</DialogTitle>
              <DialogDescription>Send a new event to the notification pipeline.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePublish} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="event-type">Event Type</Label>
                 <Select value={publishData.event_type} onValueChange={(v) => {
                        if (!v) return
                        setPublishData({ ...publishData, event_type: v, payload: effectivePayloadExamples[v] || '{}' })
                      }}>
                   <SelectTrigger><SelectValue /></SelectTrigger>
                   <SelectContent>
                     {effectiveEventTypes.map((et) => (
                       <SelectItem key={et} value={et}>{et}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-payload">Payload (JSON)</Label>
                <Textarea id="event-payload" value={publishData.payload} onChange={(e) => setPublishData({ ...publishData, payload: e.target.value })} rows={5} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-channels">Channels (comma-separated)</Label>
                <Input id="event-channels" value={publishData.channels} onChange={(e) => setPublishData({ ...publishData, channels: e.target.value })} placeholder="email, sms" required />
              </div>
              {applications.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="event-application">Application</Label>
                  <Select value={selectedAppId} onValueChange={(v) => {
                        if (!v) return
                        setSelectedAppId(v)
                      }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {applications.map((app) => (
                        <SelectItem key={app.id} value={app.id}>{app.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <DialogFooter>
                <Button type="submit">Publish</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {publishResult && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-3">
            <p className="text-sm text-green-800"><strong>Success:</strong> {publishResult}</p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card><CardContent className="p-4"><div className="h-8 w-full animate-pulse rounded bg-muted" /></CardContent></Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Processed</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-mono text-xs">{event.event_type}</TableCell>
                  <TableCell><Badge variant="outline">{event.status}</Badge></TableCell>
                  <TableCell><Badge variant={event.is_processed ? "default" : "secondary"}>{event.is_processed ? "Yes" : "No"}</Badge></TableCell>
                  <TableCell className="text-xs">{new Date(event.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {events.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No events yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Quick Publish</CardTitle><CardDescription>Use the button above to publish events. Example payloads are pre-filled.</CardDescription></CardHeader>
        <CardContent>
          <Tabs defaultValue="email">
            <TabsList>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="sms">SMS</TabsTrigger>
              <TabsTrigger value="all">All Channels</TabsTrigger>
            </TabsList>
            <TabsContent value="email">
              <pre className="text-xs bg-muted p-3 rounded-md">{`{
  "event_type": "${effectiveEventTypes[0]}",
  "payload": { "customer": "Alice", "email": "alice@example.com", "phone": "+254700000000", "amount": "KES 5,250" },
  "channels": ["email"]
}`}</pre>
            </TabsContent>
            <TabsContent value="sms">
              <pre className="text-xs bg-muted p-3 rounded-md">{`{
  "event_type": "${effectiveEventTypes[0]}",
  "payload": { "phone": "+254700000000", "otp": "123456" },
  "channels": ["sms"]
}`}</pre>
            </TabsContent>
            <TabsContent value="all">
              <pre className="text-xs bg-muted p-3 rounded-md">{`{
  "event_type": "${effectiveEventTypes[0]}",
  "payload": { "name": "Bob", "email": "bob@example.com" },
  "channels": ["email", "sms"]
}`}</pre>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}