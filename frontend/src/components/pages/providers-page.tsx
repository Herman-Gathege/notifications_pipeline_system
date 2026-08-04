import { useState, useEffect } from "react"
import { useApi } from "@/hooks/use-api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
      const data = await get("/api/v1/providers")
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
      await post("/api/v1/providers", createData)
      setCreateData({ name: "", channel: "email", priority: 1, is_active: true, transport_type: "api" })
      setCreateOpen(false)
      fetchProviders()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create provider")
    }
  }

  const handleToggle = async (id: string, currentActive: boolean) => {
    try {
      await patch(`/api/v1/providers/${id}`, { is_active: !currentActive })
      fetchProviders()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update provider")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await del(`/api/v1/providers/${id}`)
      fetchProviders()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete provider")
    }
  }

  const handleTest = async (id: string) => {
    setTestingId(id)
    setTestResult(null)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/providers/${id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient: "test@example.com" }),
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Providers</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button />}>
            Add Provider
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Provider</DialogTitle>
              <DialogDescription>Configure a new notification provider.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="provider-name">Name</Label>
                <Input
                  id="provider-name"
                  value={createData.name}
                  onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                  placeholder="e.g., Resend, SMTP Local"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provider-channel">Channel</Label>
                  <Select
                    value={createData.channel}
                    onValueChange={(v) => setCreateData({ ...createData, channel: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provider-transport">Transport</Label>
                  <Select
                    value={createData.transport_type}
                    onValueChange={(v) => setCreateData({ ...createData, transport_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="api">API</SelectItem>
                      <SelectItem value="smtp">SMTP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="provider-priority">Priority</Label>
                <Input
                  id="provider-priority"
                  type="number"
                  min={1}
                  value={createData.priority}
                  onChange={(e) => setCreateData({ ...createData, priority: parseInt(e.target.value) || 1 })}
                />
              </div>
              <DialogFooter>
                <Button type="submit">Create</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <Card>
          <CardContent className="p-4">
            <div className="h-8 w-full animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
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
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell className="font-medium">{provider.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{provider.channel}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">{provider.transport_type}</TableCell>
                  <TableCell>{provider.priority}</TableCell>
                  <TableCell>
                    <Badge variant={provider.is_active ? "default" : "secondary"}>
                      {provider.is_active ? "Active" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest(provider.id)}
                      disabled={testingId === provider.id}
                    >
                      {testingId === provider.id ? "Testing..." : "Test"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggle(provider.id, provider.is_active)}
                    >
                      {provider.is_active ? "Disable" : "Enable"}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
                        Delete
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Provider</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{provider.name}"?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(provider.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
              {providers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No providers configured yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {testResult && (
        <Card>
          <CardContent className="p-3">
            <p className="text-sm">
              <strong>Test Result:</strong> {testResult}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}