import { Router } from "express";
import {
  predictDetection,
  getHistory,
  getAnalytics,
  getTrends,
} from "./detection.controller.js";
const router = Router();

router.post("/predict", predictDetection);
router.get("/history", getHistory);
router.get("/analytics", getAnalytics);
router.get("/trends", getTrends);


export default router;