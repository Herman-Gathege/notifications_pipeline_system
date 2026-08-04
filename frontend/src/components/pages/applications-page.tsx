import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useApi } from "@/hooks/use-api"

interface Application {
  id: string
  name: string
  api_key: string
  secret: string
  status: string
  created_at: string
  updated_at: string
}

export default function ApplicationsPage() {
  const navigate = useNavigate()
  const { get, post, patch, del } = useApi<Application[]>()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState("")
  const [editingApp, setEditingApp] = useState<Application | null>(null)
  const [editName, setEditName] = useState("")

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const data = await get("/api/v1/applications")
      setApplications(data)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load applications")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await post("/api/v1/applications", { name })
      setName("")
      setCreateOpen(false)
      fetchApplications()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create application")
    }
  }

  const handleUpdate = async (id: string) => {
    try {
      await patch(`/api/v1/applications/${id}`, { name: editName })
      setEditingApp(null)
      setEditName("")
      fetchApplications()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update application")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await del(`/api/v1/applications/${id}`)
      fetchApplications()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete application")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Applications</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button />}>
            Create Application
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Application</DialogTitle>
              <DialogDescription>Add a new application to send notifications.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="app-name">Name</Label>
                <Input
                  id="app-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Application"
                  required
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
                <TableHead>Status</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.name}</TableCell>
                  <TableCell>
                    <Badge variant={app.status === "active" ? "default" : "secondary"}>
                      {app.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs">{app.api_key}</TableCell>
                  <TableCell className="text-xs">{new Date(app.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingApp(app)
                        setEditName(app.name)
                      }}
                    >
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
                        Delete
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Application</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{app.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(app.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
              {applications.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No applications yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {editingApp && (
        <Dialog open={!!editingApp} onOpenChange={() => { setEditingApp(null); setEditName("") }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Application</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdate(editingApp.id) }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-app-name">Name</Label>
                <Input
                  id="edit-app-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}