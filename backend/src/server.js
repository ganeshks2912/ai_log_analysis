import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRoutes from "./routes/index.js";
import { connectRedis } from "./config/redis.js";
import { checkDatabase } from "./config/database.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();

app.disable("x-powered-by");

app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/api", (_req, res) => {
  res.json({
    success: true,
    service: "AI Log Bot Detection API",
    version: "1.0.0",
  });
});

app.use("/api", apiRoutes);
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await checkDatabase();
    await connectRedis();

    app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
      console.log("PostgreSQL connected");
      console.log("Redis connected");
    });
  } catch (error) {
    console.error("Failed to start backend:", error);
    process.exit(1);
  }
};

startServer();

export default app;
