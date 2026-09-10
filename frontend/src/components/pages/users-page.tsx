import { useEffect, useState } from "react"
import {
  KeyRound,
  Pencil,
  Trash2,
  UserPlus,
  UsersIcon,
} from "lucide-react"

import {
  EmptyRow,
  Field,
  Page,
  PageHeader,
  StatCard,
  TableSkeletonRows,
} from "@/components/page-kit"
import { formatDate } from "@/lib/format"
import { useApi } from "@/hooks/use-api"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/contexts/auth-context"

interface User {
  id: string
  name: string
  email: string
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface FormState {
  name: string
  email: string
  password: string
  role: string
  is_active: boolean
}

const emptyForm: FormState = {
  name: "",
  email: "",
  password: "",
  role: "user",
  is_active: true,
}

export default function UsersPage() {
  const { get, post, patch, del } = useApi<User[]>()
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<User | null>(null)
  const [editForm, setEditForm] = useState<FormState>(emptyForm)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState<FormState>(emptyForm)
  const [deleting, setDeleting] = useState<User | null>(null)
  const [resetting, setResetting] = useState<User | null>(null)
  const [resetPassword, setResetPasswordValue] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError("")
      const data = await get("/users")
      setUsers(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load users"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase().trim()
    if (!q) return true
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    )
  })

  const flashSuccess = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(""), 2500)
  }

  const handleToggleActive = async (user: User) => {
    if (user.id === currentUser?.id) {
      setError("You cannot deactivate your own account.")
      return
    }
    try {
      await patch(`/users/${user.id}`, { is_active: !user.is_active })
      flashSuccess(`${user.name} ${!user.is_active ? "activated" : "deactivated"}.`)
      fetchUsers()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update user"
      setError(message)
    }
  }

  const openEdit = (user: User) => {
    setEditing(user)
    setEditForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      is_active: user.is_active,
    })
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    try {
      setSubmitting(true)
      setError("")
      await patch(`/users/${editing.id}`, {
        name: editForm.name,
        role: editForm.role,
        is_active: editForm.is_active,
      })
      setEditing(null)
      flashSuccess("User updated.")
      fetchUsers()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update user"
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      setError("")
      await post("/users", {
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
        role: createForm.role,
        is_active: createForm.is_active,
      })
      setCreating(false)
      setCreateForm(emptyForm)
      flashSuccess("User created.")
      fetchUsers()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create user"
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    try {
      setSubmitting(true)
      setError("")
      await del(`/users/${deleting.id}`)
      setDeleting(null)
      flashSuccess("User deleted.")
      fetchUsers()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete user"
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetting) return
    try {
      setSubmitting(true)
      setError("")
      await post(`/users/${resetting.id}/reset-password`, { password: resetPassword })
      setResetting(null)
      setResetPasswordValue("")
      flashSuccess(`Password reset for ${resetting.name}.`)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reset password"
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const activeCount = users.filter((u) => u.is_active).length
  const adminCount = users.filter((u) => u.role === "admin").length

  return (
    <Page>
      <PageHeader
        title="Users"
        description="Accounts with access to this workspace and what they can do."
        actions={
          <Button
            onClick={() => {
              setCreateForm(emptyForm)
              setCreating(true)
            }}
          >
            <UserPlus />
            New user
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total users" value={users.length} tone="neutral" />
        <StatCard label="Active users" value={activeCount} tone="success" />
        <StatCard label="Administrators" value={adminCount} tone="brand" />
      </div>

      {(error || success) && (
        <Alert variant={error ? "destructive" : "success"}>
          <AlertTitle>{error ? "Action failed" : "Done"}</AlertTitle>
          <AlertDescription>{error || success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <div className="flex flex-col gap-3 border-b-2 border-[var(--ink)] bg-surface-2 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-sm">
            <Input
              placeholder="Search by name, email, role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search users"
              type="search"
            />
          </div>
          <p className="shrink-0 text-xs font-bold uppercase tracking-[0.1em] text-[var(--ink-muted)]">
            Showing {filteredUsers.length} of {users.length}
          </p>
        </div>

        <div>
          {loading ? (
            <TableSkeletonRows columns={6} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-bold text-[var(--ink)]">
                      {user.name}
                    </TableCell>
                    <TableCell>
                      <div className="cell-truncate max-w-[220px] text-[var(--ink-muted)]" title={user.email}>
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        {user.role === "admin" ? "Admin" : "User"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={user.is_active}
                          disabled={user.id === currentUser?.id}
                          onCheckedChange={() => handleToggleActive(user)}
                        />
                        <span
                          className={`text-[11px] font-black uppercase tracking-[0.08em] ${
                            user.is_active ? "text-[var(--success)]" : "text-[var(--ink-faint)]"
                          }`}
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-sm whitespace-nowrap text-[var(--ink-muted)] lg:table-cell">
                      {formatDate(user.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() => openEdit(user)}
                          aria-label="Edit user"
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() => {
                            setResetting(user)
                            setResetPasswordValue("")
                          }}
                          aria-label="Reset password"
                          disabled={user.id === currentUser?.id}
                        >
                          <KeyRound />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon-sm"
                          onClick={() => setDeleting(user)}
                          aria-label="Delete user"
                          disabled={user.id === currentUser?.id}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && !loading && (
                  <EmptyRow
                    colSpan={6}
                    icon={UsersIcon}
                    title={search ? "No matching users" : "No users yet"}
                    description={
                      search
                        ? "Try a different name, email or role."
                        : "Create the first account for this workspace."
                    }
                    action={
                      search ? (
                        <Button variant="outline" size="sm" onClick={() => setSearch("")}>
                          Clear search
                        </Button>
                      ) : undefined
                    }
                  />
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>

      {/* Create user dialog */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create user</DialogTitle>
            <DialogDescription>
              Add a new user account. The password must be at least 8 characters.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-5">
            <Field label="Name" htmlFor="create-name">
              <Input
                id="create-name"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                required
                minLength={1}
              />
            </Field>
            <Field label="Email" htmlFor="create-email">
              <Input
                id="create-email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                required
              />
            </Field>
            <Field label="Password" htmlFor="create-password">
              <Input
                id="create-password"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                required
                minLength={8}
              />
            </Field>
            <Field label="Role" htmlFor="create-role">
              <Select
                value={createForm.role}
                onValueChange={(v) => v && setCreateForm({ ...createForm, role: v })}
              >
                <SelectTrigger id="create-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div className="flex items-center justify-between gap-4 border-2 border-[var(--ink)] bg-surface-2 px-4 py-3">
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[var(--ink)]">
                  Active
                </p>
                <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                  Inactive accounts cannot sign in.
                </p>
              </div>
              <Switch
                id="create-active"
                checked={createForm.is_active}
                onCheckedChange={(v) => setCreateForm({ ...createForm, is_active: v })}
                aria-label="Account active"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreating(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit user dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
            <DialogDescription>Update user details. Email cannot be changed.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="flex flex-col gap-5">
            <Field label="Name" htmlFor="edit-name">
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </Field>
            <Field label="Email" htmlFor="edit-email" hint="Email cannot be changed.">
              <Input id="edit-email" value={editForm.email} disabled />
            </Field>
            <Field label="Role" htmlFor="edit-role">
              <Select
                value={editForm.role}
                onValueChange={(v) => v && setEditForm({ ...editForm, role: v })}
                disabled={editing?.id === currentUser?.id}
              >
                <SelectTrigger id="edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
              {editing?.id === currentUser?.id && (
                <p className="text-xs text-[var(--ink-muted)]">
                  You cannot change your own role.
                </p>
              )}
            </Field>
            <div className="flex items-center justify-between gap-4 border-2 border-[var(--ink)] bg-surface-2 px-4 py-3">
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[var(--ink)]">
                  Active
                </p>
                <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                  Inactive accounts cannot sign in.
                </p>
              </div>
              <Switch
                id="edit-active"
                checked={editForm.is_active}
                onCheckedChange={(v) => setEditForm({ ...editForm, is_active: v })}
                disabled={editing?.id === currentUser?.id}
                aria-label="Account active"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(null)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset password dialog */}
      <Dialog open={!!resetting} onOpenChange={(open) => !open && setResetting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>
              Set a new password for <span className="font-semibold">{resetting?.email}</span>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
            <Field
              label="New password"
              htmlFor="reset-password"
              hint="At least 8 characters."
            >
              <Input
                id="reset-password"
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPasswordValue(e.target.value)}
                required
                minLength={8}
              />
            </Field>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setResetting(null)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Resetting..." : "Reset Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The user{" "}
              <span className="font-bold">{deleting?.email}</span> will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  )
}
