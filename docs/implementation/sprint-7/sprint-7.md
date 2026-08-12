# Sprint 7 — Admin Panel & Frontend Testing

## Sprint Goal

Build a functional admin panel that allows the team to authenticate, navigate the system, and test all endpoints end-to-end from the browser.

The panel covers the full notification lifecycle: authenticate → manage applications → configure providers → manage templates → publish events → monitor notifications → view statistics.

---

## Objectives

- Authentication page with API key/secret login
- Dashboard with real-time statistics
- Applications CRUD
- Providers CRUD + test
- Templates CRUD
- Events publishing (full flow)
- Notifications monitoring + retry
- Monitoring statistics and logs
- Report generation

---

## Endpoints Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/token` | Get JWT token with API key + secret |

### Applications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/applications` | List all applications |
| POST | `/api/v1/applications` | Create application |
| GET | `/api/v1/applications/{id}` | Get application |
| PATCH | `/api/v1/applications/{id}` | Update application |
| DELETE | `/api/v1/applications/{id}` | Delete application |

### Providers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/providers` | List all providers |
| POST | `/api/v1/providers` | Create provider |
| PATCH | `/api/v1/providers/{id}` | Update provider |
| DELETE | `/api/v1/providers/{id}` | Delete provider |
| POST | `/api/v1/providers/{id}/test` | Test provider |

### Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/templates` | List all templates |
| POST | `/api/v1/templates` | Create template |
| PATCH | `/api/v1/templates/{id}` | Update template |
| DELETE | `/api/v1/templates/{id}` | Delete template |

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/events` | List all events |
| POST | `/api/v1/events` | Publish event |
| GET | `/api/v1/events/{id}` | Get event |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/notifications` | List all notifications |
| GET | `/api/v1/notifications/{id}` | Get notification |
| POST | `/api/v1/notifications/{id}/retry` | Retry notification |

### Monitoring
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/monitoring/statistics` | Get aggregate stats |
| GET | `/api/v1/monitoring/logs` | Get recent notification logs |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/reports/generate` | Generate 30-day report |

---

## Auth Flow

```
1. User enters API key + secret on login page
2. POST /api/v1/auth/token → returns access_token
3. Store token in localStorage
4. Attach "Authorization: Bearer <token>" header to all subsequent requests
5. On logout, remove token
```

## Full Notification Flow (Demo)

```
1. Authenticate
2. Create an Application (if none exists)
3. Create a Provider (SMTP or Resend for email, Africa's Talking for SMS)
4. Create a Template (e.g., payment.success for email)
5. Publish an Event with the application's API key
6. Watch the notification appear in the notifications list
7. Check monitoring statistics
8. Retry a failed notification if needed
9. Generate a report
```

---

## Frontend Structure

```
frontend/src/
├── App.tsx                          # Router setup
├── main.tsx
├── hooks/
│   └── use-api.ts                   # API utility with auth
├── components/
│   ├── dashboard.tsx                # Main layout (sidebar + content)
│   ├── app-sidebar.tsx              # Navigation sidebar
│   ├── site-header.tsx              # Top header
│   ├── nav-main.tsx                 # Sidebar nav items
│   ├── nav-user.tsx                 # User menu
│   ├── pages/
│   │   ├── login-page.tsx           # Authentication
│   │   ├── dashboard-page.tsx       # Overview + statistics
│   │   ├── applications-page.tsx    # Applications CRUD
│   │   ├── providers-page.tsx       # Providers CRUD + test
│   │   ├── templates-page.tsx       # Templates CRUD
│   │   ├── events-page.tsx          # Publish + list events
│   │   ├── notifications-page.tsx   # List + retry notifications
│   │   ├── monitoring-page.tsx      # Statistics + logs
│   │   └── reports-page.tsx         # Report generation
│   └── ui/                          # Existing shadcn components
```

---

## Acceptance Criteria

- [ ] Login page authenticates against backend
- [ ] Sidebar navigation works between all sections
- [ ] Each section can perform its intended CRUD operations
- [ ] Authentication token is sent with every API request
- [ ] Error messages from the backend are displayed to the user
- [ ] The full notification flow (app → provider → template → event → notification) works end-to-end
- [ ] Monitoring statistics are displayed
- [ ] Reports can be generated
- [ ] All endpoints are testable from the admin panel