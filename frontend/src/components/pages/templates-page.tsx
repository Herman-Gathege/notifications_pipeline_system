import { useState, useEffect } from "react"
import { FileTextIcon, PlusIcon } from "lucide-react"

import {
  EmptyRow,
  ErrorState,
  Field,
  FieldGrid,
  Page,
  PageHeader,
  TableSkeleton,
} from "@/components/page-kit"
import { useApi } from "@/hooks/use-api"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
      const data = await get("/templates")
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
      await post("/templates", createData)
      setCreateData({ name: "", event_type: "", channel: "email", subject: "", body: "" })
      setCreateOpen(false)
      fetchTemplates()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create template")
    }
  }

  const handleUpdate = async (id: string) => {
    try {
      await patch(`/templates/${id}`, editData)
      setEditingTemplate(null)
      setEditData({ name: "", event_type: "", channel: "email", subject: "", body: "" })
      fetchTemplates()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update template")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await del(`/templates/${id}`)
      fetchTemplates()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete template")
    }
  }

  return (
    <Page>
      <PageHeader
        title="Templates"
        description="Message content mapped to event types and channels."
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={<Button />}>
              <PlusIcon />
              Create template
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create template</DialogTitle>
                <DialogDescription>
                  Define a notification template for an event type.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="flex flex-col gap-5">
                <Field label="Name" htmlFor="tmpl-name">
                  <Input
                    id="tmpl-name"
                    value={createData.name}
                    onChange={(e) =>
                      setCreateData({ ...createData, name: e.target.value })
                    }
                    placeholder="Payment Email"
                    required
                  />
                </Field>
                <FieldGrid>
                  <Field label="Event type" htmlFor="tmpl-event">
                    <Input
                      id="tmpl-event"
                      value={createData.event_type}
                      onChange={(e) =>
                        setCreateData({
                          ...createData,
                          event_type: e.target.value,
                        })
                      }
                      placeholder="payment.success"
                      required
                    />
                  </Field>
                  <Field label="Channel" htmlFor="tmpl-channel">
                    <Select
                      value={createData.channel}
                      onValueChange={(v) => {
                        if (!v) return
                        setCreateData({ ...createData, channel: v })
                      }}
                    >
                      <SelectTrigger id="tmpl-channel">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldGrid>
                <Field label="Subject" htmlFor="tmpl-subject">
                  <Input
                    id="tmpl-subject"
                    value={createData.subject}
                    onChange={(e) =>
                      setCreateData({ ...createData, subject: e.target.value })
                    }
                    placeholder="Payment Received"
                  />
                </Field>
                <Field
                  label="Body"
                  htmlFor="tmpl-body"
                  hint={`Use {{variable}} placeholders to inject event payload values.`}
                >
                  <Textarea
                    id="tmpl-body"
                    value={createData.body}
                    onChange={(e) =>
                      setCreateData({ ...createData, body: e.target.value })
                    }
                    placeholder="Hello {{customer}}, your payment of {{amount}} has been received."
                    rows={4}
                    required
                  />
                </Field>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Create</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {error ? <ErrorState message={error} onRetry={fetchTemplates} /> : null}

      {loading ? (
        <TableSkeleton columns={6} label="Loading templates" />
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((tmpl) => (
                <TableRow key={tmpl.id}>
                  <TableCell className="font-bold text-[var(--ink)]">
                    {tmpl.name}
                  </TableCell>
                  <TableCell className="cell-mono">{tmpl.event_type}</TableCell>
                  <TableCell><Badge variant="secondary">{tmpl.channel}</Badge></TableCell>
                  <TableCell>
                    <div
                      className="cell-truncate text-xs text-[var(--ink-muted)]"
                      title={tmpl.subject || undefined}
                    >
                      {tmpl.subject || "—"}
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={tmpl.is_active ? "success" : "secondary"}>{tmpl.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setEditingTemplate(tmpl); setEditData({ name: tmpl.name, event_type: tmpl.event_type, channel: tmpl.channel, subject: tmpl.subject || "", body: tmpl.body }) }}>Edit</Button>
                      <AlertDialog>
                        <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
                          Delete
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Delete template</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete "{tmpl.name}"? This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => handleDelete(tmpl.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {templates.length === 0 && (
                <EmptyRow
                  colSpan={6}
                  icon={FileTextIcon}
                  title="No templates yet"
                  description="Create a template so events can be rendered into messages."
                  action={
                    <Button size="sm" onClick={() => setCreateOpen(true)}>
                      <PlusIcon />
                      Create template
                    </Button>
                  }
                />
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {editingTemplate && (
        <Dialog open={!!editingTemplate} onOpenChange={() => { setEditingTemplate(null); setEditData({ name: "", event_type: "", channel: "email", subject: "", body: "" }) }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Template</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdate(editingTemplate.id) }} className="flex flex-col gap-5">
              <Field label="Name"><Input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} required /></Field>
              <FieldGrid>
                <Field label="Event type"><Input value={editData.event_type} onChange={(e) => setEditData({ ...editData, event_type: e.target.value })} required /></Field>
                <Field label="Channel"><Select value={editData.channel}                     onValueChange={(v) => {
                      if (!v) return
                      setEditData({ ...editData, channel: v })
                    }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="email">Email</SelectItem><SelectItem value="sms">SMS</SelectItem><SelectItem value="whatsapp">WhatsApp</SelectItem></SelectContent></Select>
                </Field>
              </FieldGrid>
              <Field label="Subject"><Input value={editData.subject} onChange={(e) => setEditData({ ...editData, subject: e.target.value })} /></Field>
              <Field label="Body"><Textarea value={editData.body} onChange={(e) => setEditData({ ...editData, body: e.target.value })} rows={4} required /></Field>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingTemplate(null)
                    setEditData({ name: "", event_type: "", channel: "email", subject: "", body: "" })
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </Page>
  )
}
