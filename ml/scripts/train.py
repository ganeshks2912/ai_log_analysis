from pathlib import Path

import joblib
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)


# ============================================================
# Configuration
# ============================================================

RANDOM_STATE = 42
TARGET = "ROBOT"

N_ESTIMATORS = 200
MAX_DEPTH = None
MIN_SAMPLES_SPLIT = 2
MIN_SAMPLES_LEAF = 1

SCRIPT_DIR = Path(__file__).resolve().parent
ML_DIR = SCRIPT_DIR.parent

PROCESSED_DIR = ML_DIR / "data" / "processed"
MODEL_DIR = ML_DIR / "models"

TRAIN_PATH = PROCESSED_DIR / "train.csv"
VALIDATION_PATH = PROCESSED_DIR / "validation.csv"

MODEL_PATH = MODEL_DIR / "random_forest.joblib"
FEATURE_IMPORTANCE_PATH = MODEL_DIR / "feature_importance.csv"


# ============================================================
# Load data
# ============================================================

def load_data():
    print("Loading training and validation datasets...")

    train = pd.read_csv(TRAIN_PATH)
    validation = pd.read_csv(VALIDATION_PATH)

    print(f"Training shape: {train.shape}")
    print(f"Validation shape: {validation.shape}")

    X_train = train.drop(columns=[TARGET])
    y_train = train[TARGET]

    X_validation = validation.drop(columns=[TARGET])
    y_validation = validation[TARGET]

    return (
        X_train,
        y_train,
        X_validation,
        y_validation,
    )


# ============================================================
# Train model
# ============================================================

def train_model(X_train, y_train):

    print("\nTraining Random Forest...")
    print(f"Number of trees: {N_ESTIMATORS}")
    print(f"Random state: {RANDOM_STATE}")

    model = RandomForestClassifier(
        n_estimators=N_ESTIMATORS,
        max_depth=MAX_DEPTH,
        min_samples_split=MIN_SAMPLES_SPLIT,
        min_samples_leaf=MIN_SAMPLES_LEAF,
        random_state=RANDOM_STATE,
        n_jobs=-1,
        class_weight="balanced",
    )

    model.fit(X_train, y_train)

    print("Training completed.")

    return model


# ============================================================
# Evaluate model
# ============================================================

def evaluate_model(
    model,
    X_validation,
    y_validation,
):

    print("\n========================================")
    print("VALIDATION RESULTS")
    print("========================================")

    predictions = model.predict(X_validation)

    probabilities = model.predict_proba(
        X_validation
    )[:, 1]

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

    print(f"\nAccuracy : {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall   : {recall:.4f}")
    print(f"F1 Score : {f1:.4f}")
    print(f"ROC-AUC  : {roc_auc:.4f}")

    print("\nClassification Report:")
    print(
        classification_report(
            y_validation,
            predictions,
            target_names=[
                "Human",
                "Bot",
            ],
            zero_division=0,
        )
    )

    print("Confusion Matrix:")

    matrix = confusion_matrix(
        y_validation,
        predictions,
    )

    print(matrix)

    print("\nMatrix interpretation:")
    print(
        f"True Human  : {matrix[0][0]}"
    )
    print(
        f"False Bot   : {matrix[0][1]}"
    )
    print(
        f"False Human : {matrix[1][0]}"
    )
    print(
        f"True Bot    : {matrix[1][1]}"
    )

    return {
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "roc_auc": roc_auc,
    }


# ============================================================
# Feature importance
# ============================================================

def save_feature_importance(
    model,
    feature_names,
):

    importance = pd.DataFrame(
        {
            "feature": feature_names,
            "importance": model.feature_importances_,
        }
    )

    importance = importance.sort_values(
        by="importance",
        ascending=False,
    )

    importance.to_csv(
        FEATURE_IMPORTANCE_PATH,
        index=False,
    )

    print("\n========================================")
    print("TOP FEATURE IMPORTANCE")
    print("========================================")

    print(
        importance.head(15).to_string(
            index=False
        )
    )

    print(
        f"\nFull feature importance saved to:"
        f"\n{FEATURE_IMPORTANCE_PATH}"
    )


# ============================================================
# Save model
# ============================================================

def save_model(model):

    MODEL_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    joblib.dump(
        model,
        MODEL_PATH,
    )

    print(
        f"\nModel saved to:"
        f"\n{MODEL_PATH}"
    )


# ============================================================
# Main
# ============================================================

def main():

    print("========================================")
    print("AI BOT DETECTION - RANDOM FOREST")
    print("========================================")

    # Check files
    if not TRAIN_PATH.exists():
        raise FileNotFoundError(
            f"Training dataset not found:\n{TRAIN_PATH}"
        )

    if not VALIDATION_PATH.exists():
        raise FileNotFoundError(
            f"Validation dataset not found:\n"
            f"{VALIDATION_PATH}"
        )

    # Load
    (
        X_train,
        y_train,
        X_validation,
        y_validation,
    ) = load_data()

    # Train
    model = train_model(
        X_train,
        y_train,
    )

    # Evaluate
    metrics = evaluate_model(
        model,
        X_validation,
        y_validation,
    )

    # Feature importance
    save_feature_importance(
        model,
        X_train.columns,
    )

    # Save model
    save_model(model)

    print("\n========================================")
    print("TRAINING PIPELINE COMPLETE")
    print("========================================")

    print("\nSummary:")
    print(
        f"Accuracy : {metrics['accuracy']:.4f}"
    )
    print(
        f"Precision: {metrics['precision']:.4f}"
    )
    print(
        f"Recall   : {metrics['recall']:.4f}"
    )
    print(
        f"F1 Score : {metrics['f1']:.4f}"
    )
    print(
        f"ROC-AUC  : {metrics['roc_auc']:.4f}"
    )


if __name__ == "__main__":
    main()