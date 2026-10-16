import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { uploadLogCsv } from "./logs.controller.js";
import { uploadRawLog } from "./rawLogs.controller.js";

const router = Router();

const uploadDirectory = path.resolve("uploads");

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (_req, file, cb) => {
    const uniqueName =
      `${Date.now()}-${Math.round(Math.random() * 1e9)}` +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

const csvUpload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: (_req, file, cb) => {
    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    if (extension !== ".csv") {
      return cb(
        new Error("Only CSV files are allowed.")
      );
    }

    cb(null, true);
  },
});

const rawLogUpload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: (_req, file, cb) => {
    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    const allowedExtensions = [
      ".log",
      ".txt",
    ];

    if (!allowedExtensions.includes(extension)) {
      return cb(
        new Error(
          "Only .log and .txt raw log files are allowed."
        )
      );
    }

    cb(null, true);
  },
});

/*
 * Existing endpoint:
 *
 * POST /api/logs/upload
 *
 * Uploads a CSV containing the 30 ML features.
 */
router.post(
  "/upload",
  csvUpload.single("file"),
  uploadLogCsv
);

/*
 * New endpoint:
 *
 * POST /api/logs/upload-raw
 *
 * Uploads a raw Apache/Nginx-style access log.
 */
router.post(
  "/upload-raw",
  rawLogUpload.single("file"),
  uploadRawLog
);

export default router;