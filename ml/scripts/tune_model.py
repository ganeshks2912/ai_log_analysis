from pathlib import Path

import joblib
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import (
    GridSearchCV,
    StratifiedKFold,
)


# ============================================================
# Configuration
# ============================================================

TARGET = "ROBOT"
RANDOM_STATE = 42

SCRIPT_DIR = Path(__file__).resolve().parent
ML_DIR = SCRIPT_DIR.parent

PROCESSED_DIR = ML_DIR / "data" / "processed"
MODEL_DIR = ML_DIR / "models"

TRAIN_PATH = PROCESSED_DIR / "train.csv"
VALIDATION_PATH = PROCESSED_DIR / "validation.csv"

MODEL_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


# ============================================================
# Load data
# ============================================================

print("========================================")
print("FAST RANDOM FOREST TUNING")
print("========================================")

train = pd.read_csv(TRAIN_PATH)
validation = pd.read_csv(VALIDATION_PATH)

X_train = train.drop(columns=[TARGET])
y_train = train[TARGET]

X_validation = validation.drop(columns=[TARGET])
y_validation = validation[TARGET]

print(f"\nTraining shape: {X_train.shape}")
print(f"Validation shape: {X_validation.shape}")


# ============================================================
# Base model
# ============================================================

model = RandomForestClassifier(
    random_state=RANDOM_STATE,
    n_jobs=-1,
    class_weight="balanced",
)


# ============================================================
# Smaller parameter grid
# ============================================================

param_grid = {
    "n_estimators": [
        100,
        200,
    ],

    "max_depth": [
        None,
        20,
        30,
    ],

    "min_samples_leaf": [
        1,
        2,
    ],

    "max_features": [
        "sqrt",
    ],
}


# 2 × 3 × 2 × 1 = 12 configurations
# 12 × 5 folds = 60 fits


# ============================================================
# Cross-validation
# ============================================================

cv = StratifiedKFold(
    n_splits=5,
    shuffle=True,
    random_state=RANDOM_STATE,
)


# ============================================================
# Grid search
# ============================================================

print("\nStarting GridSearchCV...")
print("Configurations: 12")
print("Cross-validation folds: 5")
print("Total fits: 60")
print("This should be much faster than the previous search.\n")


grid_search = GridSearchCV(
    estimator=model,
    param_grid=param_grid,
    scoring="f1",
    cv=cv,
    n_jobs=-1,
    verbose=2,
    return_train_score=False,
)


grid_search.fit(
    X_train,
    y_train,
)


# ============================================================
# Best configuration
# ============================================================

print("\n========================================")
print("BEST CONFIGURATION")
print("========================================")

print("\nBest parameters:")

print(
    grid_search.best_params_
)

print(
    f"\nBest CV F1: "
    f"{grid_search.best_score_:.4f}"
)


# ============================================================
# Validation evaluation
# ============================================================

best_model = grid_search.best_estimator_

predictions = best_model.predict(
    X_validation
)

probabilities = (
    best_model
    .predict_proba(X_validation)[:, 1]
)


accuracy = accuracy_score(
    y_validation,
    predictions,
)

precision = precision_score(
    y_validation,
    predictions,
    zero_division=0,
)

recall = recall_score(
    y_validation,
    predictions,
    zero_division=0,
)

f1 = f1_score(
    y_validation,
    predictions,
    zero_division=0,
)

roc_auc = roc_auc_score(
    y_validation,
    probabilities,
)


print("\n========================================")
print("VALIDATION RESULTS")
print("========================================")

print(
    f"\nAccuracy : {accuracy:.4f}"
)

print(
    f"Precision: {precision:.4f}"
)

print(
    f"Recall   : {recall:.4f}"
)

print(
    f"F1 Score : {f1:.4f}"
)

print(
    f"ROC-AUC  : {roc_auc:.4f}"
)


# ============================================================
# Save tuning results
# ============================================================

results = pd.DataFrame(
    grid_search.cv_results_
)

results = results.sort_values(
    by="rank_test_score"
)

results_path = (
    MODEL_DIR /
    "random_forest_tuning_results.csv"
)

results.to_csv(
    results_path,
    index=False,
)


print(
    f"\nTuning results saved to:"
    f"\n{results_path}"
)


# ============================================================
# Save tuned model
# ============================================================

model_path = (
    MODEL_DIR /
    "random_forest_tuned.joblib"
)

joblib.dump(
    best_model,
    model_path,
)


print(
    f"\nTuned model saved to:"
    f"\n{model_path}"
)


print("\n========================================")
print("FAST TUNING COMPLETE")
print("========================================")