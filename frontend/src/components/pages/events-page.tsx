import { useState, useEffect } from "react"
import { CheckCircle2Icon, SendIcon } from "lucide-react"

import {
  EmptyRow,
  ErrorState,
  Field,
  Page,
  PageHeader,
  TableSkeleton,
} from "@/components/page-kit"
import { formatTimestamp } from "@/lib/format"
import { useApi } from "@/hooks/use-api"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
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
    <Page>
      <PageHeader
        title="Events"
        description="Publish domain events and follow them through the pipeline."
        actions={
          <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
            <DialogTrigger render={<Button />}>
              <SendIcon />
              Publish event
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Publish event</DialogTitle>
                <DialogDescription>
                  Send a new event to the notification pipeline.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handlePublish} className="flex flex-col gap-5">
                <Field label="Event type" htmlFor="event-type">
                  <Select value={publishData.event_type} onValueChange={(v) => {
                        if (!v) return
                        setPublishData({ ...publishData, event_type: v, payload: effectivePayloadExamples[v] || '{}' })
                      }}>
                    <SelectTrigger id="event-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {effectiveEventTypes.map((et) => (
                        <SelectItem key={et} value={et}>{et}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Payload (JSON)" htmlFor="event-payload">
                  <Textarea
                    id="event-payload"
                    value={publishData.payload}
                    onChange={(e) => setPublishData({ ...publishData, payload: e.target.value })}
                    rows={6}
                    spellCheck={false}
                    className="font-mono text-xs"
                    required
                  />
                </Field>
                <Field
                  label="Channels"
                  htmlFor="event-channels"
                  hint="Comma-separated, for example email, sms."
                >
                  <Input
                    id="event-channels"
                    value={publishData.channels}
                    onChange={(e) => setPublishData({ ...publishData, channels: e.target.value })}
                    placeholder="email, sms"
                    required
                  />
                </Field>
                {applications.length > 0 && (
                  <Field label="Application" htmlFor="event-application">
                    <Select value={selectedAppId} onValueChange={(v) => {
                          if (!v) return
                          setSelectedAppId(v)
                        }}>
                      <SelectTrigger id="event-application"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {applications.map((app) => (
                          <SelectItem key={app.id} value={app.id}>{app.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setPublishOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Publish</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {error ? <ErrorState message={error} onRetry={fetchEvents} /> : null}

      {publishResult && (
        <Alert variant="success">
          <CheckCircle2Icon />
          <AlertTitle>Event published</AlertTitle>
          <AlertDescription>{publishResult}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <TableSkeleton columns={4} label="Loading events" />
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
                  <TableCell>
                    <Badge
                      variant={
                        event.status === "processed"
                          ? "success"
                          : event.status === "failed"
                            ? "destructive"
                            : "info"
                      }
                    >
                      {event.status}
                    </Badge>
                  </TableCell>
                  <TableCell><Badge variant={event.is_processed ? "default" : "secondary"}>{event.is_processed ? "Yes" : "No"}</Badge></TableCell>
                  <TableCell className="text-xs whitespace-nowrap text-[var(--ink-muted)]">
                    {formatTimestamp(event.created_at)}
                  </TableCell>
                </TableRow>
              ))}
              {events.length === 0 && (
                <EmptyRow
                  colSpan={4}
                  icon={SendIcon}
                  title="No events yet"
                  description="Publish an event to fan it out across the configured channels."
                  action={
                    <Button size="sm" onClick={() => setPublishOpen(true)}>
                      <SendIcon />
                      Publish event
                    </Button>
                  }
                />
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Example payloads</CardTitle>
          <CardDescription>
            Publishing an event pre-fills the matching payload from these shapes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="email">
            <TabsList>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="sms">SMS</TabsTrigger>
              <TabsTrigger value="all">All Channels</TabsTrigger>
            </TabsList>
            <TabsContent value="email">
              <CodeBlock>{`{
  "event_type": "${effectiveEventTypes[0]}",
  "payload": { "customer": "Alice", "email": "alice@example.com", "phone": "+254700000000", "amount": "KES 5,250" },
  "channels": ["email"]
}`}</CodeBlock>
            </TabsContent>
            <TabsContent value="sms">
              <CodeBlock>{`{
  "event_type": "${effectiveEventTypes[0]}",
  "payload": { "phone": "+254700000000", "otp": "123456" },
  "channels": ["sms"]
}`}</CodeBlock>
            </TabsContent>
            <TabsContent value="all">
              <CodeBlock>{`{
  "event_type": "${effectiveEventTypes[0]}",
  "payload": { "name": "Bob", "email": "bob@example.com" },
  "channels": ["email", "sms"]
}`}</CodeBlock>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </Page>
  )
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="mt-3 overflow-x-auto border-2 border-[var(--ink)] bg-[var(--ink)] p-4 font-mono text-xs leading-relaxed text-white/90 shadow-[var(--shadow-brutal-sm)]">
      {children}
    </pre>
  )
}
