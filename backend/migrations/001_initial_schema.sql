CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'ANALYST'
        CHECK (role IN ('ADMIN', 'ANALYST', 'VIEWER')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS log_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_name VARCHAR(255) NOT NULL,
    source_type VARCHAR(50) NOT NULL DEFAULT 'UPLOAD',
    total_records INTEGER NOT NULL DEFAULT 0,
    processed_records INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'UPLOADED'
        CHECK (status IN ('UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED')),
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS raw_logs (
    id BIGSERIAL PRIMARY KEY,
    batch_id UUID NOT NULL REFERENCES log_batches(id) ON DELETE CASCADE,
    event_time TIMESTAMPTZ,
    ip_address INET,
    http_method VARCHAR(12),
    request_path TEXT,
    status_code SMALLINT,
    user_agent TEXT,
    response_size BIGINT,
    referer TEXT,
    session_key VARCHAR(255),
    raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES log_batches(id) ON DELETE CASCADE,
    session_key VARCHAR(255) NOT NULL,
    ip_address INET,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    request_count INTEGER NOT NULL DEFAULT 0,
    unique_paths INTEGER NOT NULL DEFAULT 0,
    avg_request_interval_ms NUMERIC(14, 3),
    error_rate NUMERIC(7, 4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(batch_id, session_key)
);

CREATE TABLE IF NOT EXISTS model_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(100) NOT NULL,
    algorithm VARCHAR(100) NOT NULL,
    dataset_name VARCHAR(255) NOT NULL,
    dataset_source TEXT,
    version VARCHAR(50) NOT NULL,
    accuracy NUMERIC(7, 5),
    precision_score NUMERIC(7, 5),
    recall_score NUMERIC(7, 5),
    f1_score NUMERIC(7, 5),
    roc_auc NUMERIC(7, 5),
    feature_count INTEGER,
    artifact_path TEXT,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS detections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES log_batches(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    model_version_id UUID REFERENCES model_versions(id) ON DELETE SET NULL,
    ip_address INET,
    prediction VARCHAR(20) NOT NULL CHECK (prediction IN ('BOT', 'HUMAN', 'UNKNOWN')),
    confidence NUMERIC(7, 5),
    anomaly_score NUMERIC(7, 5),
    features JSONB NOT NULL DEFAULT '{}'::jsonb,
    explanation JSONB NOT NULL DEFAULT '[]'::jsonb,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    detection_id UUID REFERENCES detections(id) ON DELETE SET NULL,
    batch_id UUID REFERENCES log_batches(id) ON DELETE CASCADE,
    alert_type VARCHAR(80) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    ip_address INET,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(80),
    resource_id VARCHAR(120),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_raw_logs_batch_id ON raw_logs(batch_id);
CREATE INDEX IF NOT EXISTS idx_raw_logs_ip_address ON raw_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_raw_logs_event_time ON raw_logs(event_time);
CREATE INDEX IF NOT EXISTS idx_sessions_batch_id ON sessions(batch_id);
CREATE INDEX IF NOT EXISTS idx_detections_batch_id ON detections(batch_id);
CREATE INDEX IF NOT EXISTS idx_detections_prediction ON detections(prediction);
CREATE INDEX IF NOT EXISTS idx_detections_ip_address ON detections(ip_address);
CREATE INDEX IF NOT EXISTS idx_detections_detected_at ON detections(detected_at);
CREATE INDEX IF NOT EXISTS idx_alerts_batch_id ON alerts(batch_id);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
