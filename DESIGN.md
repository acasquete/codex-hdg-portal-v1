# HDG Portal Interface Design

This document outlines a Microsoft 365–inspired interface for the Hazardous and Dangerous Goods (HDG) Portal. The design emphasizes accessibility, neutral enterprise styling, and auditable Human-in-the-Loop workflows.

## 1. Navigation and Information Architecture
- **Left sidebar** links: Dashboard, Ingestion, Processed Documents, Schema Configuration, Review Queue, Users, Analytics, Configuration.
- Light and dark modes with a responsive layout.
- Clear table filters and keyboard-accessible components.

## 2. User Management (RBAC)
- User table columns: name, email, role, status, last activity.
- Roles: Admin, Analyst, Viewer, DG Certified Operator, Compliance Manager, Regional Compliance Manager, Global Compliance Director.
- Create, edit, delete users; assign roles; revoke access.
- Access control enforced on approval, dismissal, locking actions.
- Placeholder authentication hook for future integration.

## 3. Ingestion Panel
- Manual upload for single documents in test scenarios.
- Production indicator for Kafka ingestion; configuration fields for brokers, topics, authentication.
- Connection health widget with metrics: messages consumed, lag, errors.

## 4. Processed Documents
- Flat table: one row per logical page or document.
- Columns: source file name, page number, document type, dangerous goods flag, confidence percentage.
- Filters: text search on file name, document type dropdown, DG flag boolean, confidence range slider.
- Row selection opens preview pane showing PDF/image with bounding boxes.
- Side panel lists extracted fields (supplier, date, items, totals, UN/CAS/hazard codes, symbols) and raw key–value confidences. Hazardous elements highlighted distinctly.

## 5. Schema Configuration
- Upload and edit JSON schema files with syntax highlighting, linting, and validation.
- Versioning controls: save, label, compare, rollback.
- Apply schema to ingestion pipeline with environment targeting.

## 6. Review Queue (Human-in-the-Loop)
- Auto-generated queue for potential hidden DG items.
- Cards show file, page, reasons flagged, indicators matched, severity, confidence.
- Reviewer actions: acknowledge, escalate, dismiss (false positive), confirm DG.
- Confirmation flow includes placeholder for form/cert generation and optional external lock.
- All actions timestamped with actor and notes for full auditability.

## 7. Detection and Rules
- Combine OCR and NLP parsing with keyword and symbol detection.
- Regex patterns for UN numbers, CAS numbers, hazard codes, flash point formats.
- Configurable keyword lists per region or customer.
- Rules and patterns editable without code via schema/rule store.
- Display conversion issues and OCR warnings for triage.

## 8. Analytics
- File metrics: total ingested files, pages per file (avg), logical documents per file (avg), percentage of files with DG.
- Detection performance: accuracy, false positive/negative rates, confidence distribution, top indicators, time-series of DG percentages.
- Operational metrics: review turnaround, time-to-resolution, queue aging, reopened cases, lock/unlock counts.
- User analytics: files processed per user/role, active users over time, adoption trends.
- Distribution charts by document type, region, customer.
- Dashboards include line, bar, and pie charts plus a table for top 10 hazardous materials.
- Data export options: CSV, XLSX, PDF, JSON.

## 9. Configuration
- Kafka settings: brokers, topics, auth, TLS, consumer group, lag thresholds, dead-letter topic.
- Models: select and tune HDG and Customs Portal models, thresholds, language options.
- Rules: manage keyword lists, regex and symbol libraries per region/customer.
- Audit and logging: retention settings, export to SIEM/Data Lake, error reporting.
- RBAC defaults and required certifications per role.

## 10. KPIs and SLAs
- Target ≥95 % recall on predefined DG keywords and symbols.
- Monitor precision and recall over time.
- SLA targets for review turnaround and queue aging with baseline vs current performance indicators.

## 11. Demo Flow
1. User uploads a multi-page PDF via manual ingestion.
2. System splits the file into logical documents and extracts fields using the active schema.
3. Processed Documents table lists each logical document with filters available.
4. Selecting a row opens the preview with hazardous highlights.
5. Items with indicators appear in the Review Queue for Human-in-the-Loop actions.
6. On confirmation, the system locks the external case/file (if enabled) and records the full audit trail.
7. Analytics update in real time with detection and operational metrics.

## Style Guidelines
- M365-like UI with clear spacing and accessible contrast.
- Fully responsive with keyboard navigation and ARIA labels.
- Support for light and dark modes across all components.
