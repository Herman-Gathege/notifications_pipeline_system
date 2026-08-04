import { useState, useEffect } from "react"
import { useApi } from "@/hooks/use-api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
}

const EVENT_TYPES = ["payment.success", "payment.rejected", "user.registered", "password.reset", "otp.requested"]

export default function EventsPage() {
  const { get, post } = useApi<Event[]>()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [publishOpen, setPublishOpen] = useState(false)
  const [publishData, setPublishData] = useState<EventCreateData>({
    event_type: EVENT_TYPES[0],
    payload: '{"customer":"Alice","amount":"KES 5,250"}',
    channels: "email",
  })
  const [publishResult, setPublishResult] = useState<string | null>(null)

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const data = await get("/api/v1/events")
      setEvents(data)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault()
    setPublishResult(null)
    try {
      const payload = JSON.parse(publishData.payload)
      const channels = publishData.channels.split(",").map((c) => c.trim()).filter(Boolean)
      await post("/api/v1/events", { event_type: publishData.event_type, payload, channels })
      setPublishResult("Event published successfully!")
      setPublishData({ event_type: EVENT_TYPES[0], payload: '{"customer":"Alice","amount":"KES 5,250"}', channels: "email" })
      setPublishOpen(false)
      fetchEvents()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish event")
      setPublishResult(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Events</h1>
        <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
          <DialogTrigger asChild>
            <Button>Publish Event</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Publish Event</DialogTitle>
              <DialogDescription>Send a new event to the notification pipeline.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePublish} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="event-type">Event Type</Label>
                <Select value={publishData.event_type} onValueChange={(v) => setPublishData({ ...publishData, event_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((et) => (
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
  "event_type": "payment.success",
  "payload": { "customer": "Alice", "amount": "KES 5,250" },
  "channels": ["email"]
}`}</pre>
            </TabsContent>
            <TabsContent value="sms">
              <pre className="text-xs bg-muted p-3 rounded-md">{`{
  "event_type": "otp.requested",
  "payload": { "phone": "+254700000000", "otp": "123456" },
  "channels": ["sms"]
}`}</pre>
            </TabsContent>
            <TabsContent value="all">
              <pre className="text-xs bg-muted p-3 rounded-md">{`{
  "event_type": "user.registered",
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