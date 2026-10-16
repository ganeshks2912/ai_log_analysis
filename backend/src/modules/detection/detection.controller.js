import { predictBot } from "./detection.service.js";
import {
  saveDetection,
  getDetectionHistory,
  getDetectionAnalytics,
  getDetectionTrends,
} from "./detection.repository.js";

export const predictDetection = async (req, res, next) => {
  try {
    const features = req.body;

    if (!features || Object.keys(features).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Prediction features are required",
      });
    }

    // Send features to the ML service
    const result = await predictBot(features);

    // Save prediction to PostgreSQL
    const savedDetection = await saveDetection({
      prediction: result.prediction,
      label: result.label,
      human_probability: result.human_probability,
      bot_probability: result.bot_probability,
      number_of_requests: features.NUMBER_OF_REQUESTS,
      total_duration: features.TOTAL_DURATION,
      average_time: features.AVERAGE_TIME,
      repeated_requests: features.REPEATED_REQUESTS,
    });

    res.json({
      success: true,
      data: {
        prediction: result.prediction,
        label: result.label,
        human_probability: result.human_probability,
        bot_probability: result.bot_probability,
        detection_id: savedDetection.id,
        created_at: savedDetection.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getHistory = async (req, res, next) => {
  try {
    const limit = Math.min(
      Number.parseInt(req.query.limit, 10) || 50,
      100
    );

    const history = await getDetectionHistory(limit);

    res.json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

export const getAnalytics = async (_req, res, next) => {
  try {
    const analytics = await getDetectionAnalytics();

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};

export const getTrends = async (_req, res, next) => {
  try {
    const trends = await getDetectionTrends();

    res.json({
      success: true,
      data: trends,
    });
  } catch (error) {
    next(error);
  }
};