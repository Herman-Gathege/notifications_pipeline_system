import * as React from "react"
import { AlertTriangleIcon, InboxIcon, type LucideIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

/**
 * Page shell — one vertical rhythm for every screen.
 */
export function Page({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <div className={cn("page-shell", className)}>{children}</div>
}

/**
 * Page heading. Each page owns exactly one h1 — the site header no longer
 * repeats it, so hierarchy stays unambiguous.
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <header className={cn("page-header", className)}>
      <div className="min-w-0">
        <h1 className="page-title">{title}</h1>
        {description ? <p className="page-description">{description}</p> : null}
      </div>
      {actions ? (
        <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          {actions}
        </div>
      ) : null}
    </header>
  )
}

type Tone = "neutral" | "brand" | "success" | "warning" | "danger" | "info"

const toneBar: Record<Tone, string> = {
  neutral: "bg-[var(--ink)]",
  brand: "bg-[var(--brand-orange)]",
  success: "bg-[var(--success)]",
  warning: "bg-[var(--warning)]",
  danger: "bg-[var(--destructive)]",
  info: "bg-[var(--info)]",
}

/**
 * Stat tile. The accent rail carries the meaning; the number stays ink so
 * figures remain the most prominent element on the page.
 */
export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
  className,
}: {
  label: React.ReactNode
  value: React.ReactNode
  hint?: React.ReactNode
  tone?: Tone
  className?: string
}) {
  return (
    <Card size="sm" className={cn("relative overflow-hidden", className)}>
      <span
        aria-hidden="true"
        className={cn("absolute inset-y-0 left-0 w-1", toneBar[tone])}
      />
      <CardContent className="pl-6">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={cn("size-2 shrink-0", toneBar[tone])}
          />
          <span className="section-label">{label}</span>
        </div>
        <div className="stat-value mt-3">{value}</div>
        {hint ? (
          <p className="mt-2 text-xs text-[var(--ink-muted)]">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}

/**
 * Error callout for failed fetches and mutations.
 */
export function ErrorState({
  message,
  title = "Something went wrong",
  onRetry,
  className,
}: {
  message: string
  title?: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangleIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>{message}</span>
          {onRetry ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="w-full border-[var(--destructive)] text-[var(--destructive)] hover:bg-[var(--destructive)] hover:text-white sm:w-auto"
            >
              Try again
            </Button>
          ) : null}
        </div>
      </AlertDescription>
    </Alert>
  )
}

/**
 * Empty state for a data table row.
 */
export function EmptyRow({
  colSpan,
  title,
  description,
  action,
  icon: Icon = InboxIcon,
}: {
  colSpan: number
  title: string
  description?: string
  action?: React.ReactNode
  icon?: LucideIcon
}) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colSpan} className="px-4 py-14">
        <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-center">
          <span className="flex size-12 items-center justify-center border-2 border-[var(--border-mid)] bg-surface-2 text-[var(--ink-muted)]">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-black uppercase tracking-[0.06em] text-[var(--ink)]">
              {title}
            </p>
            {description ? (
              <p className="text-sm leading-relaxed text-[var(--ink-muted)]">
                {description}
              </p>
            ) : null}
          </div>
          {action}
        </div>
      </TableCell>
    </TableRow>
  )
}

/**
 * Loading placeholder shaped like the table it replaces.
 */
export function TableSkeleton({
  rows = 5,
  columns = 5,
  label = "Loading",
}: {
  rows?: number
  columns?: number
  label?: string
}) {
  return (
    <Card aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      <TableSkeletonRows rows={rows} columns={columns} />
    </Card>
  )
}

/**
 * Skeleton rows for a table that already sits inside its own container.
 */
export function TableSkeletonRows({
  rows = 5,
  columns = 5,
}: {
  rows?: number
  columns?: number
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {Array.from({ length: columns }).map((_, index) => (
            <TableHead key={index}>
              <Skeleton className="h-3 w-16" />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRow key={rowIndex} className="hover:bg-transparent">
            {Array.from({ length: columns }).map((_, columnIndex) => (
              <TableCell key={columnIndex}>
                <Skeleton
                  className={cn("h-4", columnIndex === 0 ? "w-40" : "w-20")}
                />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

/**
 * Form field — normalizes label typography and vertical rhythm in dialogs.
 */
export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: React.ReactNode
  htmlFor?: string
  hint?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label
        htmlFor={htmlFor}
        className="text-[11px] font-black uppercase tracking-[0.12em] text-[var(--ink-muted)]"
      >
        {label}
      </Label>
      {children}
      {hint ? (
        <p className="text-xs leading-relaxed text-[var(--ink-muted)]">{hint}</p>
      ) : null}
    </div>
  )
}

/**
 * Responsive two-up form grid: stacks on small screens, pairs from sm up.
 */
export function FieldGrid({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2", className)}>
      {children}
    </div>
  )
}
