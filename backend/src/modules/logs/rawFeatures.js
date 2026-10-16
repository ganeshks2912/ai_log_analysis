import fs from "fs";
import path from "path";

const exportDirectory = path.resolve(
  "exports",
  "raw-features"
);

export const saveRawFeatures = (
  sessions
) => {
  if (!fs.existsSync(exportDirectory)) {
    fs.mkdirSync(exportDirectory, {
      recursive: true,
    });
  }

  const timestamp =
    new Date()
      .toISOString()
      .replace(/[:.]/g, "-");

  const filePath = path.join(
    exportDirectory,
    `raw-features-${timestamp}.json`
  );

  const data = {
    generated_at:
      new Date().toISOString(),

    session_count:
      sessions.length,

    rows: sessions.map(
      (session) => session.features
    ),
  };

  fs.writeFileSync(
    filePath,
    JSON.stringify(
      data,
      null,
      2
    ),
    "utf-8"
  );

  return filePath;
};