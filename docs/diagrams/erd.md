
---

### docs/diagrams/erd.md

```md
# Entity Relationship Diagram

```mermaid
erDiagram

APPLICATIONS ||--o{ API_KEYS : owns
APPLICATIONS ||--o{ NOTIFICATIONS : creates
NOTIFICATIONS ||--o{ DELIVERY_ATTEMPTS : has

APPLICATIONS{
uuid id
string name
string secret
boolean status
}

API_KEYS{
uuid id
uuid application_id
string token
boolean is_active
datetime expires_at
}

NOTIFICATIONS{
uuid id
uuid application_id
string channel
string recipient
string status
json payload
}

DELIVERY_ATTEMPTS{
uuid id
uuid notification_id
string provider
string status
integer attempt
}