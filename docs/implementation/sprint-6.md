# Sprint 6 — Monitoring & Reporting

## Sprint Goal

Add observability and analytics to the Notification Platform.

The platform now exposes real-time statistics, notification logs, and periodic report generation so operators can track delivery health without guessing.

---

# Objectives

- Expose Prometheus metrics endpoint
- Add monitoring statistics API
- Add notification log retrieval API
- Implement report generation with analytics
- Track delivery success/failure rates by channel
- Identify best-performing providers
- Store historical report records

---

# Features Implemented

## Prometheus Metrics Endpoint

- `GET /metrics` exposes Prometheus-format metrics
- Uses `prometheus-client` library
- Enables integration with Prometheus scraping and Grafana dashboards

## Monitoring Statistics

- `GET /api/v1/monitoring/statistics` returns aggregate counts:
  - Total events
  - Total notifications
  - Delivered notifications
  - Queued notifications
  - Failed notifications
  - Dead letter notifications

## Monitoring Logs

- `GET /api/v1/monitoring/logs` returns the 100 most recent notification records
- Includes recipient, provider, channel, status, processing time, and failure reason

## Report Generation

- `POST /api/v1/reports/generate` creates a 30-day analytics report
- Report includes:
  - Total notifications processed
  - Successful vs failed counts
  - Breakdown by channel (email, SMS, WhatsApp)
  - Best-performing provider by delivery count
  - Provider statistics (delivery counts per provider)
- Reports are persisted in the `notification_reports` table

---

# Architecture

```
Client
   │
   ▼
FastAPI
   │
   ├── GET /metrics          → prometheus-client
   │
   ├── GET /monitoring/statistics  → MonitoringService
   │
   ├── GET /monitoring/logs      → MonitoringService
   │
   └── POST /reports/generate    → ReportService
                                      │
                                      ▼
                                 ReportRepository
                                      │
                                      ▼
                                 PostgreSQL
```

---

# Components Added

## Services

- `monitoring_service.py` — Statistics aggregation and log retrieval
- `report_service.py` — Report generation with 30-day window
- `metrics_service.py` — Placeholder for future Prometheus metric definitions

## Models

- `notification_report.py` — Persistent report records with period, counts, and provider stats

## Repositories

- `report_repository.py` — Query helpers for report generation (totals, channel counts, best provider, provider statistics)

## API Routes

- `monitoring.py` — `/monitoring/statistics` and `/monitoring/logs`
- `reports.py` — `/reports/generate`

## Schemas

- `monitoring.py` — `NotificationLogResponse`
- `report.py` — `ReportResponse`

---

# Monitoring Endpoints

### Statistics

```
GET /api/v1/monitoring/statistics
```

Example response:

```json
{
  "events": 150,
  "notifications": 320,
  "delivered": 290,
  "queued": 5,
  "failed": 12,
  "dead_letter": 3
}
```

### Logs

```
GET /api/v1/monitoring/logs
```

Returns the 100 most recent notification records with full delivery details.

### Generate Report

```
POST /api/v1/reports/generate
```

Creates a 30-day analytics report and persists it to the database.

---

# Metrics Endpoint

```
GET /metrics
```

Exposes Prometheus-format metrics for scraping by Prometheus and visualization in Grafana.

---

# Database Table Added

### notification_reports

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| period_start | DateTime | Report start date |
| period_end | DateTime | Report end date |
| notifications_processed | Integer | Total notifications in period |
| successful_notifications | Integer | Delivered count |
| failed_notifications | Integer | Failed count |
| email_count | Integer | Email channel count |
| sms_count | Integer | SMS channel count |
| whatsapp_count | Integer | WhatsApp channel count |
| best_provider | String | Top provider by deliveries |
| provider_statistics | JSON | Per-provider delivery counts |
| created_at | DateTime | Report creation timestamp |

---

# Sprint 6 Acceptance Checklist

## Monitoring

- [x] Prometheus `/metrics` endpoint
- [x] Monitoring statistics endpoint
- [x] Monitoring logs endpoint
- [x] Real-time delivery counts by status

## Reporting

- [x] Report generation endpoint
- [x] 30-day analytics window
- [x] Channel breakdown (email, SMS, WhatsApp)
- [x] Best provider identification
- [x] Provider statistics
- [x] Persistent report storage

---

# Sprint 6 Success Criteria

Sprint 6 is considered complete when:

- ✅ `GET /metrics` returns Prometheus-format output
- ✅ `GET /monitoring/statistics` returns accurate aggregate counts
- ✅ `GET /monitoring/logs` returns recent notification records
- ✅ `POST /reports/generate` creates and persists a report
- ✅ Reports include channel breakdown and provider statistics
- ✅ Best provider is correctly identified from delivery data

---

# Next Sprint

Sprint 7 will focus on admin dashboard and frontend application code.