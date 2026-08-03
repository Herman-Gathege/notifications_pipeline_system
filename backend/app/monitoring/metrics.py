# backend/app/monitoring/metrics.py

from prometheus_client import Counter, Histogram

notifications_processed_total = Counter(
    "notifications_processed_total",
    "Total notifications processed",
)

notifications_delivered_total = Counter(
    "notifications_delivered_total",
    "Successfully delivered notifications",
)

notifications_failed_total = Counter(
    "notifications_failed_total",
    "Failed notifications",
)

notifications_dead_letter_total = Counter(
    "notifications_dead_letter_total",
    "Dead-letter notifications",
)

notification_processing_seconds = Histogram(
    "notification_processing_seconds",
    "Notification processing duration",
)