import { Router } from "express";

import {
  getAllAlerts,
  getSingleAlert,
  updateAlert,
  getAlertAnalytics,
} from "./alerts.controller.js";

const router = Router();

router.get(
  "/analytics",
  getAlertAnalytics
);

router.get(
  "/",
  getAllAlerts
);

router.get(
  "/:id",
  getSingleAlert
);

router.patch(
  "/:id/status",
  updateAlert
);

export default router;