import { useCallback, useRef, useState } from "react"
import axios, { type AxiosError, type AxiosInstance } from "axios"

const rawBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8001"
const API_BASE = rawBase.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "")

interface ApiError {
  message: string
  status: number
}

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: ApiError | null
}

type TokenGetter = () => string | null
type LogoutHandler = () => void

let tokenGetter: TokenGetter = () => null
let logoutHandler: LogoutHandler = () => {}

export function configureAuth(getter: TokenGetter, logout: LogoutHandler): void {
  tokenGetter = getter
  logoutHandler = logout
}

export function getToken(): string | null {
  return tokenGetter()
}

const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE}/api/v1`,
})

api.interceptors.request.use((config) => {
  const t = tokenGetter()
  if (t) {
    config.headers.Authorization = `Bearer ${t}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      try {
        logoutHandler()
      } catch {
        // ignore
      }
    }

    if (error.response) {
      const detail = error.response.data && (error.response.data as { detail?: unknown }).detail
      const message = typeof detail === "string" ? detail : "An error occurred"
      throw { message, status: error.response.status } as ApiError
    }
    throw { message: "Network error", status: 0 } as ApiError
  }
)

export function useApi<T>() {
  const stateRef = useRef<ApiState<T>>({ data: null, loading: false, error: null })
  const [, setState] = useState(stateRef.current)

  const request = useCallback(
    async (
      method: string,
      url: string,
      data?: unknown
    ): Promise<T> => {
      stateRef.current = { data: null, loading: true, error: null }
      setState({ ...stateRef.current })

      try {
        const response = await api.request<T>({
          method,
          url,
          data,
        })
        stateRef.current = { data: response.data, loading: false, error: null }
        setState({ ...stateRef.current })
        return response.data
      } catch (err) {
        const error = err as ApiError
        stateRef.current = { data: null, loading: false, error }
        setState({ ...stateRef.current })
        throw error
      }
    },
    []
  )

  const get = useCallback(
    (url: string) => request("GET", url),
    [request]
  )

  const post = useCallback(
    (url: string, data?: unknown) => request("POST", url, data),
    [request]
  )

  const patch = useCallback(
    (url: string, data?: unknown) => request("PATCH", url, data),
    [request]
  )

  const del = useCallback(
    (url: string) => request("DELETE", url),
    [request]
  )

  return {
    get,
    post,
    patch,
    del,
    loading: stateRef.current.loading,
    error: stateRef.current.error,
    data: stateRef.current.data,
  }
}

export { api }