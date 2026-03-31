# Mahara Lead Messaging Hub

## Current State
Full lead messaging hub with leads, compose, templates, sent history, user management, and settings. Messages are only stored internally (no real sending).

## Requested Changes (Diff)

### Add
- Backend `sendWhatsAppMessages` function: accepts leadIds and message body, calls Twilio WhatsApp API for each lead's phone number, returns success/error counts
- Twilio credentials stored as constants in backend: Account SID, Auth Token (base64 encoded), sender number
- Frontend sandbox opt-in reminder banner on Compose page
- Frontend WhatsApp send status (success/failure per recipient) shown after Send

### Modify
- `handleSend` in Compose.tsx: after recording the message, also call `sendWhatsAppMessages` for the selected leads; show combined result
- Send button: show WhatsApp delivery results alongside the existing success state

### Remove
- Nothing removed

## Implementation Plan
1. Select `http-outcalls` Caffeine component
2. Update `main.mo`: add `sendWhatsAppMessages(leadIds, body)` function using IC HTTP outcalls to POST to Twilio API with Basic auth
3. Update `backend.d.ts` to expose new function signature
4. Update `Compose.tsx`: add sandbox opt-in info banner, call `sendWhatsAppMessages` on send, display WhatsApp delivery results
