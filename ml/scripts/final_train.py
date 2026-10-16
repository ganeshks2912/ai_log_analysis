import os
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib

print("=" * 50)
print("FINAL RANDOM FOREST TRAINING")
print("=" * 50)

# Paths
TRAIN_PATH = "data/processed/train.csv"
VALIDATION_PATH = "data/processed/validation.csv"
MODEL_PATH = "models/random_forest_final.joblib"

# Load train and validation data
train_df = pd.read_csv(TRAIN_PATH)
validation_df = pd.read_csv(VALIDATION_PATH)

print(f"\nTrain shape: {train_df.shape}")
print(f"Validation shape: {validation_df.shape}")

# Combine train + validation
combined_df = pd.concat(
    [train_df, validation_df],
    ignore_index=True
)

print(f"Combined training shape: {combined_df.shape}")

# Separate features and target
X = combined_df.drop(columns=["ROBOT"])
y = combined_df["ROBOT"]

print("\nClass distribution:")
print(y.value_counts())
print("\nClass proportions:")
print(y.value_counts(normalize=True))

# Final model parameters selected during tuning
model = RandomForestClassifier(
    n_estimators=200,
    max_depth=None,
    min_samples_split=2,
    min_samples_leaf=1,
    max_features="sqrt",
    class_weight="balanced",
    random_state=42,
    n_jobs=-1
)

print("\nTraining final Random Forest...")
print("Parameters:")
print(model.get_params())

# Train
model.fit(X, y)

print("\nTraining completed.")

# Create models directory if needed
os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)

# Save model
joblib.dump(model, MODEL_PATH)

print(f"\nFinal model saved to:")
print(MODEL_PATH)

print("\n" + "=" * 50)
print("FINAL TRAINING COMPLETE")
print("=" * 50)