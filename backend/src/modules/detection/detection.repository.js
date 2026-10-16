import { query } from "../../config/database.js";

export const saveDetection = async ({
  prediction,
  label,
  human_probability,
  bot_probability,
  number_of_requests,
  total_duration,
  average_time,
  repeated_requests,
}) => {
  const sql = `
    INSERT INTO detection_history (
      prediction,
      label,
      human_probability,
      bot_probability,
      number_of_requests,
      total_duration,
      average_time,
      repeated_requests
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `;

  const values = [
    prediction,
    label,
    human_probability,
    bot_probability,
    number_of_requests,
    total_duration,
    average_time,
    repeated_requests,
  ];

  const { rows } = await query(sql, values);

  return rows[0];
};

export const getDetectionHistory = async (limit = 50) => {
  const sql = `
    SELECT
      id,
      prediction,
      label,
      human_probability,
      bot_probability,
      number_of_requests,
      total_duration,
      average_time,
      repeated_requests,
      created_at
    FROM detection_history
    ORDER BY created_at DESC
    LIMIT $1;
  `;

  const { rows } = await query(sql, [limit]);

  return rows;
};

export const getDetectionAnalytics = async () => {
  const sql = `
    SELECT
      COUNT(*)::INTEGER AS total_detections,
      COUNT(*) FILTER (WHERE prediction = 0)::INTEGER AS human_detections,
      COUNT(*) FILTER (WHERE prediction = 1)::INTEGER AS bot_detections,
      ROUND(
        (
          COUNT(*) FILTER (WHERE prediction = 1)::DECIMAL
          / NULLIF(COUNT(*), 0)
        ) * 100,
        2
      ) AS bot_detection_rate,
      ROUND(AVG(bot_probability), 4) AS average_bot_probability,
      ROUND(AVG(human_probability), 4) AS average_human_probability
    FROM detection_history;
  `;

  const { rows } = await query(sql);

  return rows[0];
};

export const getDetectionTrends = async () => {
  const sql = `
    SELECT
      DATE_TRUNC('hour', created_at) AS time_bucket,

      COUNT(*)::INTEGER AS total_detections,

      COUNT(*) FILTER (
        WHERE prediction = 0
      )::INTEGER AS human_detections,

      COUNT(*) FILTER (
        WHERE prediction = 1
      )::INTEGER AS bot_detections

    FROM detection_history

    WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours'

    GROUP BY DATE_TRUNC('hour', created_at)

    ORDER BY time_bucket ASC;
  `;

  const { rows } = await query(sql);

  return rows;
};