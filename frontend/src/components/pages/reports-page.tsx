import { useState } from "react"
import { useApi } from "@/hooks/use-api"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reports</h1>

        <Button onClick={handleGenerate} disabled={generating}>
          {generating ? "Generating..." : "Generate Report"}
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {lastReport && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">
              Report Generated
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-green-800">
              Report for {lastReport.period_start} to{" "}
              {lastReport.period_end}
            </p>

            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>
                Processed:{" "}
                <strong>{lastReport.notifications_processed}</strong>
              </div>

              <div>
                Delivered:{" "}
                <strong>{lastReport.successful_notifications}</strong>
              </div>

              <div>
                Failed:{" "}
                <strong>{lastReport.failed_notifications}</strong>
              </div>

              <div>
                Best Provider:{" "}
                <strong>{lastReport.best_provider || "N/A"}</strong>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card>
          <CardContent className="p-4">
            <div className="h-8 w-full animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
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
                    {report.period_start.slice(0, 10)} →{" "}
                    {report.period_end.slice(0, 10)}
                  </TableCell>

                  <TableCell>
                    {report.notifications_processed}
                  </TableCell>

                  <TableCell className="text-green-600">
                    {report.successful_notifications}
                  </TableCell>

                  <TableCell className="text-red-600">
                    {report.failed_notifications}
                  </TableCell>

                  <TableCell>{report.email_count}</TableCell>

                  <TableCell>{report.sms_count}</TableCell>

                  <TableCell>{report.whatsapp_count}</TableCell>

                  <TableCell>
                    <Badge variant="outline">
                      {report.best_provider || "N/A"}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-xs">
                    {new Date(
                      report.created_at
                    ).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}

              {reports.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center text-muted-foreground"
                  >
                    No reports yet. Generate one to see results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}