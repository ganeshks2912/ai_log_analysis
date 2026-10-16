import fs from "fs";
import { processLogCsv } from "./logs.service.js";

export const uploadLogCsv = async (req, res, next) => {
  let filePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "CSV file is required.",
      });
    }

    filePath = req.file.path;

    const result = await processLogCsv(filePath);

    return res.json({
      success: true,
      message: "CSV processed successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};