import { useEffect, useState } from "react"
import { CalendarRangeIcon, CheckCircle2Icon, FileChartColumnIcon } from "lucide-react"

import {
  EmptyRow,
  ErrorState,
  Page,
  PageHeader,
  TableSkeleton,
} from "@/components/page-kit"
import { formatDate, formatTimestamp } from "@/lib/format"
import { useApi } from "@/hooks/use-api"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card } from "@/components/ui/card"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Report {
  id: string
  period_start: string
  period_end: string
  notifications_processed: number
  successful_notifications: number
  failed_notifications: number
  email_count: number
  sms_count: number
  whatsapp_count: number
  best_provider: string | null
  provider_statistics: Record<string, number> | null
  created_at: string
}

export default function ReportsPage() {
  const { get, post } = useApi<Report[]>()

  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [generating, setGenerating] = useState(false)
  const [lastReport, setLastReport] = useState<Report | null>(null)

  const fetchReports = async () => {
    try {
      setLoading(true)

      const data = await get("/reports")

      setReports(data)
      setError("")
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load reports"
      )
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    try {
      setGenerating(true)
      setError("")
      setLastReport(null)

      await post("/reports/generate", {})

      await fetchReports()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate report"
      )
    } finally {
      setGenerating(false)
    }
  }

  useEffect(() => {
    fetchReports()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Page>
      <PageHeader
        title="Reports"
        description="Aggregated delivery performance, per period and provider."
        actions={
          <Button onClick={handleGenerate} disabled={generating}>
            <FileChartColumnIcon />
            {generating ? "Generating…" : "Generate report"}
          </Button>
        }
      />

      {error ? <ErrorState message={error} onRetry={fetchReports} /> : null}

      {lastReport && (
        <Alert variant="success">
          <CheckCircle2Icon />
          <AlertTitle>Report generated</AlertTitle>
          <AlertDescription>
            <p className="text-[var(--ink-soft)]">
              {lastReport.period_start} → {lastReport.period_end}
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
              <ReportStat
                label="Processed"
                value={lastReport.notifications_processed}
              />
              <ReportStat
                label="Delivered"
                value={lastReport.successful_notifications}
              />
              <ReportStat
                label="Failed"
                value={lastReport.failed_notifications}
              />
              <ReportStat
                label="Best provider"
                value={lastReport.best_provider || "N/A"}
              />
            </dl>
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <TableSkeleton columns={9} label="Loading reports" />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Processed</TableHead>
                <TableHead>Delivered</TableHead>
                <TableHead>Failed</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>SMS</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Best Provider</TableHead>
                <TableHead>Generated</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="text-xs">
                    {formatDate(report.period_start)} →{" "}
                    {formatDate(report.period_end)}
                  </TableCell>

                  <TableCell className="tabular-nums">
                    {report.notifications_processed}
                  </TableCell>

                  <TableCell className="font-bold tabular-nums text-[var(--success)]">
                    {report.successful_notifications}
                  </TableCell>

                  <TableCell className="font-bold tabular-nums text-[var(--destructive)]">
                    {report.failed_notifications}
                  </TableCell>

                  <TableCell className="tabular-nums">{report.email_count}</TableCell>

                  <TableCell className="tabular-nums">{report.sms_count}</TableCell>

                  <TableCell className="tabular-nums">{report.whatsapp_count}</TableCell>

                  <TableCell>
                    <Badge variant="outline">
                      {report.best_provider || "N/A"}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-xs whitespace-nowrap text-[var(--ink-muted)]">
                    {formatTimestamp(report.created_at)}
                  </TableCell>
                </TableRow>
              ))}

              {reports.length === 0 && (
                <EmptyRow
                  colSpan={9}
                  icon={CalendarRangeIcon}
                  title="No reports yet"
                  description="Generate a report to aggregate delivery performance for the current period."
                  action={
                    <Button size="sm" onClick={handleGenerate} disabled={generating}>
                      <FileChartColumnIcon />
                      {generating ? "Generating…" : "Generate report"}
                    </Button>
                  }
                />
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </Page>
  )
}

function ReportStat({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--ink-muted)]">
        {label}
      </dt>
      <dd className="text-lg font-black tabular-nums text-[var(--ink)]">
        {value}
      </dd>
    </div>
  )
}
