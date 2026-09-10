import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { AlertTriangleIcon } from "lucide-react"

import { Field } from "@/components/page-kit"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DevBadge } from "@/components/dev-badge"
import { useAuth } from "@/contexts/auth-context"

const rawBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8001"
const API_BASE = rawBase.replace(/\/$/, "")
const AUTH_BASE = API_BASE.endsWith("/api/v1") ? API_BASE : `${API_BASE}/api/v1`

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, token } = useAuth()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  if (token) {
    navigate("/dashboard")
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      setLoading(false)
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${AUTH_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || "Registration failed")
      }

      const data = await response.json()
      register(data.access_token, data.user)
      navigate("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-0 px-4 pt-10 pb-24 sm:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="border-b-2 border-[var(--ink)]">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center border-2 border-[var(--ink)] bg-[var(--brand-orange)] text-white shadow-[var(--shadow-brutal-xs)]">
              <span className="text-lg font-black tracking-tight">FT</span>
            </div>
            <div className="min-w-0">
              <CardTitle className="text-xl">Create account</CardTitle>
              <CardDescription>
                Start managing notifications in minutes.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Field label="Name" htmlFor="name">
              <Input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>
            <Field label="Email" htmlFor="email">
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="john@fikatu.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            <Field
              label="Password"
              htmlFor="password"
              hint="At least 8 characters."
            >
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>
            <Field label="Confirm password" htmlFor="confirmPassword">
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Re-type your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </Field>
            {error && (
              <Alert variant="destructive">
                <AlertTriangleIcon />
                <AlertTitle>Registration failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Creating account…" : "Create account"}
            </Button>
            <p className="border-t-2 border-[var(--border-soft)] pt-4 text-center text-sm text-[var(--ink-muted)]">
              Already have an account?{" "}
              <Link
                to="/"
                className="font-bold text-[var(--brand-orange)] underline decoration-2 underline-offset-4 hover:text-[var(--brand-orange-hover)]"
              >
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
      <DevBadge />
    </div>
  )
}
