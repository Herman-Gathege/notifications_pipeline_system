import { useState, useCallback, useRef } from "react"
import axios from "axios"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8001"

interface ApiError {
  message: string
  status: number
}

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: ApiError | null
}

let token: string | null = null

export function getToken(): string | null {
  if (token) return token
  token = localStorage.getItem("auth_token")
  return token
}

export function setToken(t: string | null): void {
  token = t
  if (t) {
    localStorage.setItem("auth_token", t)
  } else {
    localStorage.removeItem("auth_token")
  }
}

const api = axios.create({
  baseURL: API_BASE,
})

api.interceptors.request.use((config) => {
  const t = getToken()
  if (t) {
    config.headers.Authorization = `Bearer ${t}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const detail = error.response.data?.detail
      const message = typeof detail === "string" ? detail : "An error occurred"
      throw { message, status: error.response.status }
    }
    throw { message: "Network error", status: 0 }
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
      setState(stateRef.current)

      try {
        const response = await api.request<T>({
          method,
          url,
          data,
        })
        stateRef.current = { data: response.data, loading: false, error: null }
        setState(stateRef.current)
        return response.data
      } catch (err) {
        const error = err as ApiError
        stateRef.current = { data: null, loading: false, error }
        setState(stateRef.current)
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

  return { get, post, patch, del, loading: stateRef.current.loading, error: stateRef.current.error, data: stateRef.current.data }
}

export { api }