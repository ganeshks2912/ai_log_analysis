import axios from "axios";

const ML_SERVICE_URL =
  process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

export const predictBot = async (features) => {
  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/predict`,
      features,
      {
        timeout: 10000,
      }
    );

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        `ML service error: ${error.response.status} ${JSON.stringify(
          error.response.data
        )}`
      );
    }

    if (error.code === "ECONNREFUSED") {
      throw new Error(
        "ML service is unavailable. Make sure FastAPI is running on port 8000."
      );
    }

    throw new Error(
      `Failed to communicate with ML service: ${error.message}`
    );
  }
};