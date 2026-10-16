import fs from "fs";

import { processRawLogFile } from "./rawLogs.service.js";
import { saveRawFeatures } from "./rawFeatures.js";

export const uploadRawLog = async (
  req,
  res,
  next
) => {
  let filePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Raw log file is required.",
      });
    }

    filePath = req.file.path;

    const result =
      await processRawLogFile(filePath);

    /*
     * Save generated ML features for
     * development and validation.
     */
    const featureExportPath =
      saveRawFeatures(
        result.results
      );

    return res.json({
      success: true,

      message:
        "Raw log file processed successfully.",

      data: {
        total_lines:
          result.totalLines,

        parsed_lines:
          result.parsedLines,

        skipped_lines:
          result.skippedLines,

        total_sessions:
          result.total_sessions,

        human_count:
          result.human_count,

        bot_count:
          result.bot_count,

        feature_export:
          featureExportPath,

        sessions:
          result.results.map(
            (session) => ({
              session_number:
                session.session_number,

              ip:
                session.ip,

              user_agent:
                session.user_agent,

              requests:
                session.requests,

              prediction:
                session.prediction,

              label:
                session.label,

              human_probability:
                session.human_probability,

              bot_probability:
                session.bot_probability,

              detection_id:
                session.detection_id,

              explanation:
                 session.explanation,

              features:
                session.features,
            })
          ),
      },
    });
  } catch (error) {
    next(error);
  } finally {
    if (
      filePath &&
      fs.existsSync(filePath)
    ) {
      fs.unlinkSync(filePath);
    }
  }
};