import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
    <div className="flex min-h-screen items-center justify-center bg-[var(--surface-2)] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 border-b-2 border-black bg-black text-center text-white">
          <div className="mx-auto flex h-14 w-14 items-center justify-center border-2 border-[var(--brand-orange)] bg-[var(--brand-orange)] shadow-[4px_4px_0_0_#E65100]">
            <span className="text-xl font-black text-white">FT</span>
          </div>
          <div>
            <CardTitle className="text-3xl font-black uppercase tracking-tight text-white">
              FikaTu
            </CardTitle>
            <CardDescription className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-orange)]">
              Notification Platform
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <Tabs defaultValue="user" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-none border-2 border-black bg-white">
              <TabsTrigger
                value="user"
                className="rounded-none data-[state=active]:bg-[var(--brand-orange)] data-[state=active]:text-white font-bold"
              >
                User
              </TabsTrigger>
              <TabsTrigger
                value="api"
                className="rounded-none data-[state=active]:bg-[var(--brand-orange)] data-[state=active]:text-white font-bold"
              >
                API Key
              </TabsTrigger>
            </TabsList>
            <TabsContent value="user">
              <form onSubmit={handleUserLogin} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-bold uppercase tracking-wide text-xs">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@fikatu.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="font-bold uppercase tracking-wide text-xs">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {error && (
                  <div className="border-2 border-[var(--destructive)] bg-[var(--destructive)]/10 p-3 text-sm font-semibold text-[var(--destructive)]">
                    {error}
                  </div>
                )}
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="api">
              <form onSubmit={handleApiKeyLogin} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="api_key" className="font-bold uppercase tracking-wide text-xs">API Key</Label>
                  <Input
                    id="api_key"
                    type="text"
                    placeholder="Enter your API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secret" className="font-bold uppercase tracking-wide text-xs">Secret</Label>
                  <Input
                    id="secret"
                    type="password"
                    placeholder="Enter your secret"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    required
                  />
                </div>
                {error && (
                  <div className="border-2 border-[var(--destructive)] bg-[var(--destructive)]/10 p-3 text-sm font-semibold text-[var(--destructive)]">
                    {error}
                  </div>
                )}
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
