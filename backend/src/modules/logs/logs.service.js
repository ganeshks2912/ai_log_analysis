import fs from "fs";
import csv from "csv-parser";
import { predictBot } from "../detection/detection.service.js";
import { saveDetection } from "../detection/detection.repository.js";

const MODEL_FEATURES = [
  "NUMBER_OF_REQUESTS",
  "TOTAL_DURATION",
  "AVERAGE_TIME",
  "STANDARD_DEVIATION",
  "REPEATED_REQUESTS",
  "HTTP_RESPONSE_2XX",
  "HTTP_RESPONSE_3XX",
  "HTTP_RESPONSE_4XX",
  "HTTP_RESPONSE_5XX",
  "GET_METHOD",
  "POST_METHOD",
  "HEAD_METHOD",
  "OTHER_METHOD",
  "NIGHT",
  "UNASSIGNED",
  "IMAGES",
  "TOTAL_HTML",
  "HTML_TO_IMAGE",
  "HTML_TO_CSS",
  "HTML_TO_JS",
  "WIDTH",
  "DEPTH",
  "STD_DEPTH",
  "CONSECUTIVE",
  "DATA",
  "PPI",
  "SF_REFERRER",
  "SF_FILETYPE",
  "MAX_BARRAGE",
  "PENALTY",
];

const parseCsvFile = (filePath) => {
  return new Promise((resolve, reject) => {
    const rows = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        rows.push(row);
      })
      .on("end", () => {
        resolve(rows);
      })
      .on("error", reject);
  });
};

const convertRowToFeatures = (row) => {
  const features = {};

  for (const feature of MODEL_FEATURES) {
    const value = row[feature];

    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      throw new Error(
        `Missing required feature: ${feature}`
      );
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      throw new Error(
        `Invalid numeric value for ${feature}: ${value}`
      );
    }

    features[feature] = numericValue;
  }

  return features;
};

export const processLogCsv = async (filePath) => {
  const rows = await parseCsvFile(filePath);

  if (rows.length === 0) {
    throw new Error("CSV file contains no data rows.");
  }

  const results = [];

  let humanCount = 0;
  let botCount = 0;

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];

    try {
      const features = convertRowToFeatures(row);

      const prediction = await predictBot(features);

      const savedDetection = await saveDetection({
        prediction: prediction.prediction,
        label: prediction.label,
        human_probability:
          prediction.human_probability,
        bot_probability:
          prediction.bot_probability,
        number_of_requests:
          features.NUMBER_OF_REQUESTS,
        total_duration:
          features.TOTAL_DURATION,
        average_time:
          features.AVERAGE_TIME,
        repeated_requests:
          features.REPEATED_REQUESTS,
      });

      if (prediction.prediction === 1) {
        botCount += 1;
      } else {
        humanCount += 1;
      }

      results.push({
        row_number: index + 1,
        detection_id: savedDetection.id,
        prediction: prediction.prediction,
        label: prediction.label,
        human_probability:
          prediction.human_probability,
        bot_probability:
          prediction.bot_probability,
      });
    } catch (error) {
      throw new Error(
        `Failed to process row ${index + 1}: ${error.message}`
      );
    }
  }

  return {
    total_rows: rows.length,
    human_count: humanCount,
    bot_count: botCount,
    results,
  };
};