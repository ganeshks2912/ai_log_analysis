import { query } from "../../config/database.js";

export const createAlert = async ({
  detection_id,
  ip_address,
  user_agent,
  severity,
  title,
  description,
  ml_prediction,
  human_probability,
  bot_probability,
  risk_score,
}) => {
  const sql = `
    INSERT INTO alerts (
      detection_id,
      ip_address,
      user_agent,
      severity,
      title,
      description,
      ml_prediction,
      human_probability,
      bot_probability,
      risk_score
    )
    VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9, $10
    )
    RETURNING *;
  `;

  const values = [
    detection_id,
    ip_address,
    user_agent,
    severity,
    title,
    description,
    ml_prediction,
    human_probability,
    bot_probability,
    risk_score,
  ];

  const { rows } = await query(
    sql,
    values
  );

  return rows[0];
};

export const getAlerts = async (
  status = null,
  limit = 50
) => {
  const values = [];
  let sql = `
    SELECT
      id,
      detection_id,
      ip_address,
      user_agent,
      severity,
      title,
      description,
      ml_prediction,
      human_probability,
      bot_probability,
      risk_score,
      status,
      created_at,
      updated_at,
      resolved_at
    FROM alerts
  `;

  if (status) {
    values.push(status);

    sql += `
      WHERE status = $${values.length}
    `;
  }

  values.push(limit);

  sql += `
    ORDER BY created_at DESC
    LIMIT $${values.length};
  `;

  const { rows } = await query(
    sql,
    values
  );

  return rows;
};

export const getAlertById = async (
  alertId
) => {
  const sql = `
    SELECT *
    FROM alerts
    WHERE id = $1;
  `;

  const { rows } = await query(
    sql,
    [alertId]
  );

  return rows[0] || null;
};

export const updateAlertStatus = async (
  alertId,
  status
) => {
  const resolvedAt =
    status === "RESOLVED"
      ? "CURRENT_TIMESTAMP"
      : "NULL";

  const sql = `
    UPDATE alerts
    SET
      status = $1,
      updated_at = CURRENT_TIMESTAMP,
      resolved_at = ${resolvedAt}
    WHERE id = $2
    RETURNING *;
  `;

  const { rows } = await query(
    sql,
    [status, alertId]
  );

  return rows[0] || null;
};

export const getAlertAnalytics =
  async () => {
    const sql = `
      SELECT
        COUNT(*)::INTEGER AS total_alerts,

        COUNT(*) FILTER (
          WHERE status = 'OPEN'
        )::INTEGER AS open_alerts,

        COUNT(*) FILTER (
          WHERE status = 'INVESTIGATING'
        )::INTEGER AS investigating_alerts,

        COUNT(*) FILTER (
          WHERE status = 'RESOLVED'
        )::INTEGER AS resolved_alerts,

        COUNT(*) FILTER (
          WHERE severity = 'CRITICAL'
        )::INTEGER AS critical_alerts,

        COUNT(*) FILTER (
          WHERE severity = 'HIGH'
        )::INTEGER AS high_alerts,

        COUNT(*) FILTER (
          WHERE severity = 'MEDIUM'
        )::INTEGER AS medium_alerts,

        COUNT(*) FILTER (
          WHERE severity = 'LOW'
        )::INTEGER AS low_alerts

      FROM alerts;
    `;

    const { rows } =
      await query(sql);

    return rows[0];
  };