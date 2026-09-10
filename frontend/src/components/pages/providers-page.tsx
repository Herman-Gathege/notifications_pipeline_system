import { useState, useEffect } from "react"
import { CheckCircle2Icon, PlusIcon, ServerIcon } from "lucide-react"

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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

interface Provider {
  id: string
  name: string
  channel: string
  priority: number
  is_active: boolean
  transport_type: string
  created_at: string
  updated_at: string
}

interface ProviderCreateData {
  name: string
  channel: string
  priority: number
  is_active: boolean
  transport_type: string
}

export default function ProvidersPage() {
  const { get, post, patch, del } = useApi<Provider[]>()
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [createData, setCreateData] = useState<ProviderCreateData>({
    name: "",
    channel: "email",
    priority: 1,
    is_active: true,
    transport_type: "api",
  })
  const [testingId, setTestingId] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<string | null>(null)

  const fetchProviders = async () => {
    try {
      setLoading(true)
      const data = await get("/providers")
      setProviders(data)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load providers")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProviders()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await post("/providers", createData)
      setCreateData({ name: "", channel: "email", priority: 1, is_active: true, transport_type: "api" })
      setCreateOpen(false)
      fetchProviders()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create provider")
    }
  }

  const handleToggle = async (id: string, currentActive: boolean) => {
    try {
      await patch(`/providers/${id}`, { is_active: !currentActive })
      fetchProviders()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update provider")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await del(`/providers/${id}`)
      fetchProviders()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete provider")
    }
  }

  const handleTest = async (id: string) => {
    setTestingId(id)
    setTestResult(null)
    try {
      const provider = providers.find((p) => p.id === id)
      const recipient =
        provider?.channel === "sms"
          ? import.meta.env.VITE_SMS_TEST_RECIPIENT || "+15555550123"
          : "test@example.com"

      const token = localStorage.getItem("auth_token")
      const rawBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8001"
      const API_BASE = rawBase.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "")
      const response = await fetch(`${API_BASE}/api/v1/providers/${id}/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ recipient }),
      })
      const data = await response.json()
      setTestResult(data.success ? "Test sent successfully" : data.error || "Test failed")
    } catch (err) {
      setTestResult("Test failed: network error")
    } finally {
      setTestingId(null)
    }
  }

  return (
    <Page>
      <PageHeader
        title="Providers"
        description="Delivery channels, their transports and failover priority."
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={<Button />}>
              <PlusIcon />
              Add provider
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add provider</DialogTitle>
                <DialogDescription>
                  Configure a new notification provider.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="flex flex-col gap-5">
                <Field label="Name" htmlFor="provider-name">
                  <Input
                    id="provider-name"
                    value={createData.name}
                    onChange={(e) =>
                      setCreateData({ ...createData, name: e.target.value })
                    }
                    placeholder="e.g. Resend, SMTP Local"
                    required
                  />
                </Field>
                <FieldGrid>
                  <Field label="Channel" htmlFor="provider-channel">
                    <Select
                      value={createData.channel}
                      onValueChange={(v) => {
                        if (!v) return
                        setCreateData({ ...createData, channel: v })
                      }}
                    >
                      <SelectTrigger id="provider-channel">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Transport" htmlFor="provider-transport">
                    <Select
                      value={createData.transport_type}
                      onValueChange={(v) => {
                        if (!v) return
                        setCreateData({ ...createData, transport_type: v })
                      }}
                    >
                      <SelectTrigger id="provider-transport">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="api">API</SelectItem>
                        <SelectItem value="smtp">SMTP</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldGrid>
                <Field
                  label="Priority"
                  htmlFor="provider-priority"
                  hint="Lower numbers are tried first."
                >
                  <Input
                    id="provider-priority"
                    type="number"
                    min={1}
                    value={createData.priority}
                    onChange={(e) =>
                      setCreateData({
                        ...createData,
                        priority: parseInt(e.target.value) || 1,
                      })
                    }
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

      {error ? <ErrorState message={error} onRetry={fetchProviders} /> : null}

      {loading ? (
        <TableSkeleton columns={6} label="Loading providers" />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Transport</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell className="font-bold text-[var(--ink)]">
                    {provider.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{provider.channel}</Badge>
                  </TableCell>
                  <TableCell className="text-xs uppercase tracking-wide text-[var(--ink-muted)]">
                    {provider.transport_type}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {provider.priority}
                  </TableCell>
                  <TableCell>
                    <Badge variant={provider.is_active ? "success" : "secondary"}>
                      {provider.is_active ? "Active" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTest(provider.id)}
                        disabled={testingId === provider.id}
                      >
                        {testingId === provider.id ? "Testing…" : "Test"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggle(provider.id, provider.is_active)}
                      >
                        {provider.is_active ? "Disable" : "Enable"}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger
                          render={<Button variant="destructive" size="sm" />}
                        >
                          Delete
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete provider
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{provider.name}"?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              onClick={() => handleDelete(provider.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {providers.length === 0 && (
                <EmptyRow
                  colSpan={6}
                  icon={ServerIcon}
                  title="No providers configured"
                  description="Add an email, SMS or WhatsApp provider so notifications have somewhere to go."
                  action={
                    <Button size="sm" onClick={() => setCreateOpen(true)}>
                      <PlusIcon />
                      Add provider
                    </Button>
                  }
                />
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {testResult && (
        <Alert variant="success">
          <CheckCircle2Icon />
          <AlertTitle>Test result</AlertTitle>
          <AlertDescription>{testResult}</AlertDescription>
        </Alert>
      )}
    </Page>
  )
}
