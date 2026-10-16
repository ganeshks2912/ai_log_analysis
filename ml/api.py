from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import pandas as pd
import joblib
import os

# ---------------------------------------------------------
# Configuration
# ---------------------------------------------------------

MODEL_PATH = "models/random_forest_final.joblib"

# ---------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------

app = FastAPI(
    title="AI Web Log Bot Detection API",
    description="Machine learning API for detecting bot and human web sessions.",
    version="1.0.0"
)

# ---------------------------------------------------------
# Load model
# ---------------------------------------------------------

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(
        f"Model not found at: {MODEL_PATH}"
    )

model = joblib.load(MODEL_PATH)

print("Random Forest model loaded successfully.")

# ---------------------------------------------------------
# Request schema
# ---------------------------------------------------------

class PredictionRequest(BaseModel):

    NUMBER_OF_REQUESTS: float
    TOTAL_DURATION: float
    AVERAGE_TIME: float
    STANDARD_DEVIATION: float
    REPEATED_REQUESTS: float

    HTTP_RESPONSE_2XX: float
    HTTP_RESPONSE_3XX: float
    HTTP_RESPONSE_4XX: float
    HTTP_RESPONSE_5XX: float

    GET_METHOD: float
    POST_METHOD: float
    HEAD_METHOD: float
    OTHER_METHOD: float

    NIGHT: float
    UNASSIGNED: float
    IMAGES: float
    TOTAL_HTML: float

    HTML_TO_IMAGE: float
    HTML_TO_CSS: float
    HTML_TO_JS: float

    WIDTH: float
    DEPTH: float
    STD_DEPTH: float
    CONSECUTIVE: float

    DATA: float
    PPI: float

    SF_REFERRER: float
    SF_FILETYPE: float

    MAX_BARRAGE: float
    PENALTY: float


# ---------------------------------------------------------
# Health check
# ---------------------------------------------------------

@app.get("/")
def root():
    return {
        "service": "AI Web Log Bot Detection API",
        "status": "running",
        "model": "Random Forest",
        "model_version": "final"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": model is not None
    }


# ---------------------------------------------------------
# Prediction endpoint
# ---------------------------------------------------------

@app.post("/predict")
def predict(request: PredictionRequest):

    try:

        # Convert request to dictionary
        input_data = request.model_dump()

        # Convert to DataFrame
        input_df = pd.DataFrame(
            [input_data]
        )

        # Make prediction
        prediction = model.predict(input_df)[0]

        # Get probability
        probabilities = model.predict_proba(
            input_df
        )[0]

        human_probability = float(probabilities[0])
        bot_probability = float(probabilities[1])

        # Convert prediction to readable label
        if prediction == 1:
            label = "Bot"
        else:
            label = "Human"

        return {
            "prediction": int(prediction),
            "label": label,
            "human_probability": round(
                human_probability,
                4
            ),
            "bot_probability": round(
                bot_probability,
                4
            )
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )