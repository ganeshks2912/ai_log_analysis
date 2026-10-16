import {
  createAlert,
  getAlerts,
  getAlertById,
  updateAlertStatus,
  getAlertAnalytics,
} from "./alerts.repository.js";

export const createHighRiskAlert =
  async ({
    detectionId,
    session,
    prediction,
    explanation,
  }) => {
    const riskScore =
      Number(
        explanation?.risk_score || 0
      );

    let severity = "HIGH";

    if (riskScore >= 9) {
      severity = "CRITICAL";
    }

    const indicators =
      explanation?.indicators || [];

    const description =
      indicators.length > 0
        ? indicators.join("; ")
        : "High-risk behavioral activity detected.";

    return createAlert({
      detection_id: detectionId,

      ip_address:
        session.ip,

      user_agent:
        session.userAgent,

      severity,

      title:
        "High-Risk Bot Activity Detected",

      description,

      ml_prediction:
        prediction.prediction,

      human_probability:
        prediction.human_probability,

      bot_probability:
        prediction.bot_probability,

      risk_score:
        riskScore,
    });
  };

export const listAlerts =
  async (status, limit) => {
    return getAlerts(
      status,
      limit
    );
  };

export const findAlert =
  async (alertId) => {
    return getAlertById(
      alertId
    );
  };

export const changeAlertStatus =
  async (
    alertId,
    status
  ) => {
    const allowedStatuses = [
      "OPEN",
      "INVESTIGATING",
      "RESOLVED",
    ];

    if (
      !allowedStatuses.includes(
        status
      )
    ) {
      throw new Error(
        `Invalid alert status: ${status}`
      );
    }

    const alert =
      await updateAlertStatus(
        alertId,
        status
      );

    if (!alert) {
      throw new Error(
        "Alert not found."
      );
    }

    return alert;
  };

export const getAnalytics =
  async () => {
    return getAlertAnalytics();
  };