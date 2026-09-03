# Event Catalogue

## Overview

This document lists all event types currently supported by FikaTu, their payload requirements, supported channels, and associated templates.

## Current Event Types

### `payment.success`

**Purpose**: Triggered when a payment is successfully processed.

**Required Payload**:
```json
{
  "customer": "Alice",
  "email": "alice@example.com",
  "phone": "+254700000000",
  "amount": "KES 5,250"
}
```

**Optional Payload**:
- `reference` — payment reference number

**Supported Channels**: `email`, `sms`

**Example Template Variables**:
- `{{customer}}`
- `{{email}}`
- `{{phone}}`
- `{{amount}}`
- `{{reference}}`

### `user.registered`

**Purpose**: Triggered when a new user registers in an application.

**Required Payload**:
```json
{
  "name": "Bob",
  "email": "bob@example.com"
}
```

**Supported Channels**: `email`

**Example Template Variables**:
- `{{name}}`
- `{{email}}`

### `password.reset`

**Purpose**: Triggered when a user requests a password reset.

**Required Payload**:
```json
{
  "email": "alice@example.com",
  "reset_link": "https://app.example.com/reset?token=abc123"
}
```

**Supported Channels**: `email`

**Example Template Variables**:
- `{{email}}`
- `{{reset_link}}`

### `otp.requested`

**Purpose**: Triggered when a one-time password is requested.

**Required Payload**:
```json
{
  "phone": "+254700000000",
  "otp": "123456"
}
```

**Supported Channels**: `sms`

**Example Template Variables**:
- `{{phone}}`
- `{{otp}}`

### `greetings`

**Purpose**: Generic greeting / OTP-style SMS message.

**Required Payload**:
```json
{
  "customer": "John",
  "phone": "+254725325915"
}
```

**Optional Payload**:
- `otp` — optional OTP code

**Supported Channels**: `sms`

**Example Template Variables**:
- `{{customer}}`
- `{{phone}}`
- `{{otp}}`

## Future Integration Events

This section is intentionally left blank. When integrating future applications such as E-Files, the event contracts will be defined during the integration discovery phase.

Do not create placeholder event types for future integrations. Event types, payload schemas, and channel mappings will be agreed upon with the respective application teams before implementation.
