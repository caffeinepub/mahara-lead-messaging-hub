# Mahara Lead Messaging Hub

## Current State
New project. Empty backend and default frontend scaffold.

## Requested Changes (Diff)

### Add
- Lead management: create, view, edit, delete leads with fields: name, phone, email, tags, notes, status (new/contacted/qualified/closed)
- CSV/Excel import for leads (parse CSV in frontend, bulk-create via backend)
- Message composer: compose messages with text body, attach images/videos/PDFs (via blob-storage)
- Template library: save, view, and reuse message templates (title + body + optional attachments)
- Message sending: send a message to one or multiple selected leads (stored as sent message records)
- Sent messages history: per-lead view of sent messages
- Authorization: login-gated admin interface
- Navigation sidebar: Leads, Compose, Templates, Sent History

### Modify
- None (new project)

### Remove
- None

## Implementation Plan
1. Backend: Lead CRUD, Template CRUD, SentMessage records, bulk lead import endpoint, send message endpoint (stores record per recipient)
2. Components: authorization, blob-storage
3. Frontend: sidebar layout, Leads page (list + import + CRUD), Compose page (recipient picker + editor + file attach), Templates page (list + create + apply to composer), Sent History page
