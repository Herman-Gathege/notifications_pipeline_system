# backend/test_sendgrid.py

from app.providers.resend_provider import ResendProvider


provider = ResendProvider()

result = provider.send(
    recipient="siinamtechstudio@gmail.com",
    subject="Sprint 5 Test",
    body="Hello from Notification Platform 🚀",
)

print(result)