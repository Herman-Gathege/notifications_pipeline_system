import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { AlertTriangleIcon } from "lucide-react"

import { Field } from "@/components/page-kit"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DevBadge } from "@/components/dev-badge"
import { useAuth } from "@/contexts/auth-context"

const rawBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8001"
const API_BASE = rawBase.replace(/\/$/, "")
const AUTH_BASE = API_BASE.endsWith("/api/v1") ? API_BASE : `${API_BASE}/api/v1`


export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [secret, setSecret] = useState("")

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (!email) {
      setError("Please enter your email.")
      setLoading(false)
      return
    }
    if (!password) {
      setError("Please enter your password.")
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${AUTH_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || "Login failed")
      }

      const data = await response.json()
      login(data.access_token, data.user)
      navigate("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setLoading(false)
    }
  }

  const handleApiKeyLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (!apiKey) {
      setError("Please enter your API key.")
      setLoading(false)
      return
    }
    if (!secret) {
      setError("Please enter your secret.")
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${AUTH_BASE}/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey, secret }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || "Authentication failed")
      }

      const data = await response.json()
      localStorage.setItem("auth_token", data.access_token)
      navigate("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-surface-0">
      {/* Brand panel — desktop only */}
      <aside className="relative hidden w-[44%] max-w-xl flex-col justify-between border-r-2 border-[var(--ink)] bg-[var(--ink)] p-10 text-white lg:flex xl:p-14">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center border-2 border-[var(--brand-orange)] bg-[var(--brand-orange)] text-white">
            <span className="text-lg font-black tracking-tight">FT</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-black uppercase tracking-tight">
              FikaTu
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--brand-orange)]">
              Notification Platform
            </span>
          </div>
        </div>

        <div>
          <h2 className="max-w-md text-3xl leading-[1.1] font-black tracking-[-0.02em] xl:text-[38px]">
            Route every event to the right channel.
          </h2>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-white/70">
            Email, SMS and WhatsApp delivery with per-provider failover,
            reusable templates and delivery reporting.
          </p>
          <ul className="mt-9 flex flex-col gap-3.5">
            {[
              "Provider-agnostic routing",
              "Event-driven delivery pipeline",
              "Retries, dead letters and reports",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm">
                <span
                  aria-hidden="true"
                  className="size-2.5 shrink-0 bg-[var(--brand-orange)]"
                />
                <span className="text-white/90">{item}</span>
              </li>
            ))}
          </ul>
        </div>

      </aside>

      <main className="flex flex-1 items-center justify-center px-4 pt-10 pb-24 sm:px-8">
        <div className="w-full max-w-md">
      <Card>
        <CardHeader className="border-b-2 border-[var(--ink)]">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center border-2 border-[var(--ink)] bg-[var(--brand-orange)] text-white shadow-[var(--shadow-brutal-xs)]">
              <span className="text-lg font-black tracking-tight">FT</span>
            </div>
            <div className="min-w-0">
              <CardTitle className="text-xl">Sign in</CardTitle>
              <CardDescription>
                Use your account or an API key.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="user" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="user">
                User
              </TabsTrigger>
              <TabsTrigger value="api">
                API Key
              </TabsTrigger>
            </TabsList>
            <TabsContent value="user">
              <form onSubmit={handleUserLogin} className="flex flex-col gap-5 pt-1">
                <Field label="Email" htmlFor="email">
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@fikatu.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Field>
                <Field label="Password" htmlFor="password">
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Field>
                {error && (
                  <Alert variant="destructive">
                    <AlertTriangleIcon />
                    <AlertTitle>Sign-in failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="api">
              <form onSubmit={handleApiKeyLogin} className="flex flex-col gap-5 pt-1">
                <Field label="API key" htmlFor="api_key">
                  <Input
                    id="api_key"
                    type="text"
                    autoComplete="off"
                    placeholder="Enter your API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    required
                  />
                </Field>
                <Field label="Secret" htmlFor="secret">
                  <Input
                    id="secret"
                    type="password"
                    autoComplete="off"
                    placeholder="Enter your secret"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    required
                  />
                </Field>
                {error && (
                  <Alert variant="destructive">
                    <AlertTriangleIcon />
                    <AlertTitle>Sign-in failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="mt-6 border-t-2 border-[var(--border-soft)] pt-4 text-center text-sm text-[var(--ink-muted)]">
            Need an account?{" "}
            <Link
              to="/register"
              className="font-bold text-[var(--brand-orange)] underline decoration-2 underline-offset-4 hover:text-[var(--brand-orange-hover)]"
            >
              Create one
            </Link>
          </p>
        </CardContent>
      </Card>
        </div>
      </main>
      <DevBadge />
    </div>
  )
}
