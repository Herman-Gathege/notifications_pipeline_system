import { useEffect, useState } from "react"
import { useApi } from "@/hooks/use-api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Pencil, Trash2, KeyRound, UserPlus, ShieldCheck, ShieldOff } from "lucide-react"
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
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
              Total Users
            </div>
            <div className="mt-2 text-3xl font-black text-black">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
              Active Users
            </div>
            <div className="mt-2 text-3xl font-black text-[var(--brand-orange)]">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
              Administrators
            </div>
            <div className="mt-2 text-3xl font-black text-black">{adminCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 border-b-2 border-black bg-[var(--brand-orange)] text-white">
          <CardTitle className="text-white">Users</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setCreateForm(emptyForm)
              setCreating(true)
            }}
            className="border-2 border-black bg-white text-black hover:bg-black hover:text-white"
          >
            <UserPlus />
            New User
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <Input
              placeholder="Search by name, email, role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Showing {filteredUsers.length} of {users.length}
            </div>
          </div>

          {(error || success) && (
            <div
              className={`rounded-none border-2 px-3 py-2 text-sm font-medium ${
                error
                  ? "border-[var(--destructive)] bg-[var(--destructive)]/10 text-[var(--destructive)]"
                  : "border-green-700 bg-green-50 text-green-800"
              }`}
            >
              {error || success}
            </div>
          )}

          {loading ? (
            <div className="border-2 border-dashed border-black bg-muted/30 p-8 text-center font-semibold uppercase tracking-wide text-muted-foreground">
              Loading users...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-black bg-[var(--surface-2)] hover:bg-[var(--surface-2)]">
                  <TableHead className="font-black uppercase tracking-wide">Name</TableHead>
                  <TableHead className="font-black uppercase tracking-wide">Email</TableHead>
                  <TableHead className="font-black uppercase tracking-wide">Role</TableHead>
                  <TableHead className="font-black uppercase tracking-wide">Status</TableHead>
                  <TableHead className="font-black uppercase tracking-wide">Created</TableHead>
                  <TableHead className="text-right font-black uppercase tracking-wide">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-b border-black/10">
                    <TableCell className="font-bold">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
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
                          className={`text-xs font-bold uppercase tracking-wide ${
                            user.is_active ? "text-green-700" : "text-muted-foreground"
                          }`}
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
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
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="border-2 border-dashed border-black bg-muted/30 p-8 text-center font-semibold text-muted-foreground"
                    >
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create user dialog */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
            <DialogDescription>
              Add a new user account. The password must be at least 8 characters.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="create-name">Name</Label>
              <Input
                id="create-name"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                required
                minLength={1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">Password</Label>
              <Input
                id="create-password"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-role">Role</Label>
              <Select
                value={createForm.role}
                onValueChange={(v) => v && setCreateForm({ ...createForm, role: v })}
              >
                <SelectTrigger className="rounded-none border-2 border-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-none border-2 border-black bg-[var(--surface-2)] px-3 py-2">
              <Label htmlFor="create-active" className="font-bold uppercase tracking-wide">
                Active
              </Label>
              <Switch
                id="create-active"
                checked={createForm.is_active}
                onCheckedChange={(v) => setCreateForm({ ...createForm, is_active: v })}
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
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user details. Email cannot be changed.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={editForm.email} disabled className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={editForm.role}
                onValueChange={(v) => v && setEditForm({ ...editForm, role: v })}
                disabled={editing?.id === currentUser?.id}
              >
                <SelectTrigger className="rounded-none border-2 border-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
              {editing?.id === currentUser?.id && (
                <p className="text-xs font-semibold text-muted-foreground">
                  You cannot change your own role.
                </p>
              )}
            </div>
            <div className="flex items-center justify-between rounded-none border-2 border-black bg-[var(--surface-2)] px-3 py-2">
              <Label htmlFor="edit-active" className="font-bold uppercase tracking-wide">
                Active
              </Label>
              <Switch
                id="edit-active"
                checked={editForm.is_active}
                onCheckedChange={(v) => setEditForm({ ...editForm, is_active: v })}
                disabled={editing?.id === currentUser?.id}
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
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for <span className="font-semibold">{resetting?.email}</span>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="reset-password">New Password</Label>
              <Input
                id="reset-password"
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPasswordValue(e.target.value)}
                required
                minLength={8}
              />
            </div>
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
              onClick={handleDelete}
              disabled={submitting}
              className="bg-[var(--destructive)] text-white hover:bg-[var(--destructive)]/90"
            >
              {submitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="hidden">
        <ShieldCheck />
        <ShieldOff />
      </div>
    </div>
  )
}