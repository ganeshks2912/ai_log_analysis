# Database Design

The first schema supports the complete detection lifecycle:

- `users` and `refresh_tokens` — authentication
- `log_batches` — each uploaded/imported dataset or log collection
- `raw_logs` — normalized raw web log events
- `sessions` — aggregated session-level behavior
- `model_versions` — trained model metadata and evaluation metrics
- `detections` — bot/human predictions and explainability data
- `alerts` — suspicious activity notifications
- `audit_logs` — security/audit trail

The schema is designed so model versions can be tracked independently from detection results. This will let the dashboard show which model produced a prediction and what evaluation metrics that model had.
