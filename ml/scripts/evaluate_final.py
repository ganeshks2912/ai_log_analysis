import pandas as pd
import joblib

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)

print("=" * 60)
print("FINAL MODEL EVALUATION")
print("=" * 60)

# Paths
TEST_PATH = "data/processed/test.csv"
MODEL_PATH = "models/random_forest_final.joblib"

# Load test data
test_df = pd.read_csv(TEST_PATH)

print(f"\nTest shape: {test_df.shape}")

# Separate features and target
X_test = test_df.drop(columns=["ROBOT"])
y_test = test_df["ROBOT"]

print("\nTest class distribution:")
print(y_test.value_counts())

# Load final trained model
print("\nLoading final model...")
model = joblib.load(MODEL_PATH)

print("Model loaded successfully.")

# Predictions
print("\nGenerating predictions...")

y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)[:, 1]

# Metrics
accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)
roc_auc = roc_auc_score(y_test, y_prob)

# Confusion matrix
cm = confusion_matrix(y_test, y_pred)

print("\n" + "=" * 60)
print("FINAL TEST RESULTS")
print("=" * 60)

print(f"\nAccuracy  : {accuracy:.4f} ({accuracy * 100:.2f}%)")
print(f"Precision : {precision:.4f} ({precision * 100:.2f}%)")
print(f"Recall    : {recall:.4f} ({recall * 100:.2f}%)")
print(f"F1 Score  : {f1:.4f} ({f1 * 100:.2f}%)")
print(f"ROC-AUC   : {roc_auc:.4f} ({roc_auc * 100:.2f}%)")

print("\nConfusion Matrix:")
print(cm)

print("\nClassification Report:")
print(
    classification_report(
        y_test,
        y_pred,
        target_names=["Human", "Bot"]
    )
)

print("\n" + "=" * 60)
print("EVALUATION COMPLETE")
print("=" * 60)
