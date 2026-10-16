from pydantic import BaseModel

class Settings(BaseModel):
    model_name: str = "random_forest_bot_detector"
    model_version: str = "0.1.0"

settings = Settings()
