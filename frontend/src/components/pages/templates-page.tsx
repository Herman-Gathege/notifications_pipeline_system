import { useState, useEffect } from "react"
import { useApi } from "@/hooks/use-api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

interface Template {
  id: string
  name: string
  event_type: string
  channel: string
  subject: string | null
  body: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface TemplateCreateData {
  name: string
  event_type: string
  channel: string
  subject: string
  body: string
}

export default function TemplatesPage() {
  const { get, post, patch, del } = useApi<Template[]>()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [createData, setCreateData] = useState<TemplateCreateData>({
    name: "",
    event_type: "",
    channel: "email",
    subject: "",
    body: "",
  })
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [editData, setEditData] = useState<TemplateCreateData>({
    name: "",
    event_type: "",
    channel: "email",
    subject: "",
    body: "",
  })

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const data = await get("/api/v1/templates")
      setTemplates(data)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await post("/api/v1/templates", createData)
      setCreateData({ name: "", event_type: "", channel: "email", subject: "", body: "" })
      setCreateOpen(false)
      fetchTemplates()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create template")
    }
  }

  const handleUpdate = async (id: string) => {
    try {
      await patch(`/api/v1/templates/${id}`, editData)
      setEditingTemplate(null)
      setEditData({ name: "", event_type: "", channel: "email", subject: "", body: "" })
      fetchTemplates()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update template")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await del(`/api/v1/templates/${id}`)
      fetchTemplates()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete template")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Templates</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>Create Template</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Template</DialogTitle>
              <DialogDescription>Define a notification template for an event type.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tmpl-name">Name</Label>
                <Input id="tmpl-name" value={createData.name} onChange={(e) => setCreateData({ ...createData, name: e.target.value })} placeholder="Payment Email" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tmpl-event">Event Type</Label>
                  <Input id="tmpl-event" value={createData.event_type} onChange={(e) => setCreateData({ ...createData, event_type: e.target.value })} placeholder="payment.success" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tmpl-channel">Channel</Label>
                  <Select value={createData.channel} onValueChange={(v) => setCreateData({ ...createData, channel: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tmpl-subject">Subject</Label>
                <Input id="tmpl-subject" value={createData.subject} onChange={(e) => setCreateData({ ...createData, subject: e.target.value })} placeholder="Payment Received" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tmpl-body">Body (use {'{{variable}}'} for placeholders)</Label>
                <Textarea id="tmpl-body" value={createData.body} onChange={(e) => setCreateData({ ...createData, body: e.target.value })} placeholder="Hello {{customer}}, your payment of {{amount}} has been received." rows={4} required />
              </div>
              <DialogFooter>
                <Button type="submit">Create</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
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
                <TableHead>Name</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((tmpl) => (
                <TableRow key={tmpl.id}>
                  <TableCell className="font-medium">{tmpl.name}</TableCell>
                  <TableCell className="text-xs">{tmpl.event_type}</TableCell>
                  <TableCell><Badge variant="outline">{tmpl.channel}</Badge></TableCell>
                  <TableCell className="text-xs">{tmpl.subject || "—"}</TableCell>
                  <TableCell><Badge variant={tmpl.is_active ? "default" : "secondary"}>{tmpl.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                  <TableCell className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setEditingTemplate(tmpl); setEditData({ name: tmpl.name, event_type: tmpl.event_type, channel: tmpl.channel, subject: tmpl.subject || "", body: tmpl.body }) }}>Edit</Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">Delete</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Delete Template</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete "{tmpl.name}"?</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(tmpl.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
              {templates.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No templates yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>
      )}

      {editingTemplate && (
        <Dialog open={!!editingTemplate} onOpenChange={() => { setEditingTemplate(null); setEditData({ name: "", event_type: "", channel: "email", subject: "", body: "" }) }}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Edit Template</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdate(editingTemplate.id) }} className="space-y-4">
              <div className="space-y-2"><Label>Name</Label><Input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Event Type</Label><Input value={editData.event_type} onChange={(e) => setEditData({ ...editData, event_type: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Channel</Label><Select value={editData.channel} onValueChange={(v) => setEditData({ ...editData, channel: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="email">Email</SelectItem><SelectItem value="sms">SMS</SelectItem><SelectItem value="whatsapp">WhatsApp</SelectItem></SelectContent></Select></div>
              </div>
              <div className="space-y-2"><Label>Subject</Label><Input value={editData.subject} onChange={(e) => setEditData({ ...editData, subject: e.target.value })} /></div>
              <div className="space-y-2"><Label>Body</Label><Textarea value={editData.body} onChange={(e) => setEditData({ ...editData, body: e.target.value })} rows={4} required /></div>
              <DialogFooter><Button type="submit">Save</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}