import { Router } from "express";
import { checkDatabase } from "../config/database.js";
import { checkRedis } from "../config/redis.js";
import detectionRoutes from "../modules/detection/detection.routes.js";
import logsRoutes from "../modules/logs/logs.routes.js";
import alertsRoutes from "../modules/alerts/alerts.routes.js";

const router = Router();

router.get("/health", async (_req, res, next) => {
  try {
    const database = await checkDatabase();
    const redis = await checkRedis();

    res.json({
      success: true,
      service: "ai-log-bot-detection-backend",
      status: "healthy",
      dependencies: {
        postgres: {
          status: "healthy",
          checkedAt: database.now,
        },
        redis: {
          status:
            redis === "PONG"
              ? "healthy"
              : "degraded",
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.use("/detection", detectionRoutes);
router.use("/logs", logsRoutes);
router.use("/alerts", alertsRoutes);

export default router;