# backend/test_africastalking.py


from app.config.settings import settings
from app.providers.sms.africastalking_provider import AfricasTalkingProvider


provider = AfricasTalkingProvider(
    username=settings.AFRICASTALKING_USERNAME,
    api_key=settings.AFRICASTALKING_API_KEY,
    sender_id=settings.AFRICASTALKING_SENDER_ID,
)

result = provider.send(
    recipient="+254725325915",
    body="Hello from the Notification Platform 🚀",
)

print(result)