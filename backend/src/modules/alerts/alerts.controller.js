import {
  listAlerts,
  findAlert,
  changeAlertStatus,
  getAnalytics,
} from "./alerts.service.js";

export const getAllAlerts = async (
  req,
  res,
  next
) => {
  try {
    const status =
      req.query.status || null;

    const limit = Math.min(
      Number.parseInt(
        req.query.limit,
        10
      ) || 50,
      100
    );

    const alerts =
      await listAlerts(
        status,
        limit
      );

    res.json({
      success: true,
      count: alerts.length,
      data: alerts,
    });
  } catch (error) {
    next(error);
  }
};

export const getSingleAlert =
  async (
    req,
    res,
    next
  ) => {
    try {
      const alert =
        await findAlert(
          req.params.id
        );

      if (!alert) {
        return res.status(404).json({
          success: false,
          message:
            "Alert not found.",
        });
      }

      res.json({
        success: true,
        data: alert,
      });
    } catch (error) {
      next(error);
    }
  };

export const updateAlert =
  async (
    req,
    res,
    next
  ) => {
    try {
      const { status } =
        req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message:
            "Alert status is required.",
        });
      }

      const alert =
        await changeAlertStatus(
          req.params.id,
          status
        );

      res.json({
        success: true,
        message:
          "Alert status updated successfully.",
        data: alert,
      });
    } catch (error) {
      next(error);
    }
  };

export const getAlertAnalytics =
  async (
    _req,
    res,
    next
  ) => {
    try {
      const analytics =
        await getAnalytics();

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  };