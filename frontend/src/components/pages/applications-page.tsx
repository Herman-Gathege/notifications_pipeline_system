import { useState, useEffect } from "react"
import { FolderIcon, PlusIcon } from "lucide-react"

import {
  EmptyRow,
  ErrorState,
  Field,
  Page,
  PageHeader,
  TableSkeleton,
} from "@/components/page-kit"
import { formatDate } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
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
      const data = await get("/applications")
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
      await post("/applications", { name })
      setName("")
      setCreateOpen(false)
      fetchApplications()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create application")
    }
  }

  const handleUpdate = async (id: string) => {
    try {
      await patch(`/applications/${id}`, { name: editName })
      setEditingApp(null)
      setEditName("")
      fetchApplications()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update application")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await del(`/applications/${id}`)
      fetchApplications()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete application")
    }
  }

  return (
    <Page>
      <PageHeader
        title="Applications"
        description="Each application holds its own API credentials and event traffic."
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={<Button />}>
              <PlusIcon />
              Create application
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create application</DialogTitle>
                <DialogDescription>
                  Add a new application to send notifications from.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="flex flex-col gap-5">
                <Field label="Name" htmlFor="app-name">
                  <Input
                    id="app-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My Application"
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

      {error ? <ErrorState message={error} onRetry={fetchApplications} /> : null}

      {loading ? (
        <TableSkeleton columns={5} label="Loading applications" />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-bold text-[var(--ink)]">
                    {app.name}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={app.status === "active" ? "success" : "secondary"}
                    >
                      {app.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div
                      className="cell-truncate cell-mono"
                      title={app.api_key}
                    >
                      {app.api_key}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap text-[var(--ink-muted)]">
                    {formatDate(app.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
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
                        <AlertDialogTrigger
                          render={<Button variant="destructive" size="sm" />}
                        >
                          Delete
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete application
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{app.name}"? This
                              action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              onClick={() => handleDelete(app.id)}
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
              {applications.length === 0 && (
                <EmptyRow
                  colSpan={5}
                  icon={FolderIcon}
                  title="No applications yet"
                  description="Create an application to start publishing events and issuing API credentials."
                  action={
                    <Button size="sm" onClick={() => setCreateOpen(true)}>
                      <PlusIcon />
                      Create application
                    </Button>
                  }
                />
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {editingApp && (
        <Dialog open={!!editingApp} onOpenChange={() => { setEditingApp(null); setEditName("") }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit application</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => { e.preventDefault(); handleUpdate(editingApp.id) }}
              className="flex flex-col gap-5"
            >
              <Field label="Name" htmlFor="edit-app-name">
                <Input
                  id="edit-app-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </Field>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingApp(null)
                    setEditName("")
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
