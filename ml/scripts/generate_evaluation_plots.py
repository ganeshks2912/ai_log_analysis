import os
import pandas as pd
import joblib
import matplotlib.pyplot as plt

from sklearn.metrics import (
    confusion_matrix,
    ConfusionMatrixDisplay,
    roc_curve,
    roc_auc_score
)

print("=" * 60)
print("GENERATING FINAL EVALUATION VISUALIZATIONS")
print("=" * 60)

# Paths
TEST_PATH = "data/processed/test.csv"
MODEL_PATH = "models/random_forest_final.joblib"
IMPORTANCE_PATH = "models/feature_importance.csv"
OUTPUT_DIR = "reports"

os.makedirs(OUTPUT_DIR, exist_ok=True)

# ---------------------------------------------------------
# Load test data and final model
# ---------------------------------------------------------

test_df = pd.read_csv(TEST_PATH)
model = joblib.load(MODEL_PATH)

X_test = test_df.drop(columns=["ROBOT"])
y_test = test_df["ROBOT"]

y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)[:, 1]

# ---------------------------------------------------------
# 1. CONFUSION MATRIX
# ---------------------------------------------------------

print("\nGenerating confusion matrix...")

cm = confusion_matrix(y_test, y_pred)

fig, ax = plt.subplots(figsize=(7, 6))

disp = ConfusionMatrixDisplay(
    confusion_matrix=cm,
    display_labels=["Human", "Bot"]
)

disp.plot(
    ax=ax,
    cmap="Blues",
    values_format="d"
)

ax.set_title("Random Forest - Confusion Matrix")
ax.set_xlabel("Predicted Label")
ax.set_ylabel("Actual Label")

plt.tight_layout()

cm_path = os.path.join(
    OUTPUT_DIR,
    "confusion_matrix_final.png"
)

plt.savefig(cm_path, dpi=300, bbox_inches="tight")
plt.close()

print(f"Saved: {cm_path}")

# ---------------------------------------------------------
# 2. ROC CURVE
# ---------------------------------------------------------

print("Generating ROC curve...")

fpr, tpr, thresholds = roc_curve(
    y_test,
    y_prob
)

roc_auc = roc_auc_score(
    y_test,
    y_prob
)

plt.figure(figsize=(8, 6))

plt.plot(
    fpr,
    tpr,
    linewidth=2,
    label=f"Random Forest (AUC = {roc_auc:.4f})"
)

plt.plot(
    [0, 1],
    [0, 1],
    linestyle="--",
    linewidth=1
)

plt.xlabel("False Positive Rate")
plt.ylabel("True Positive Rate")
plt.title("ROC Curve - Bot Detection")

plt.legend(loc="lower right")
plt.grid(alpha=0.3)

plt.tight_layout()

roc_path = os.path.join(
    OUTPUT_DIR,
    "roc_curve_final.png"
)

plt.savefig(roc_path, dpi=300, bbox_inches="tight")
plt.close()

print(f"Saved: {roc_path}")

# ---------------------------------------------------------
# 3. FEATURE IMPORTANCE
# ---------------------------------------------------------

print("Generating feature importance chart...")

importance_df = pd.read_csv(IMPORTANCE_PATH)

# Make sure expected columns exist
if "feature" not in importance_df.columns:
    print("\nAvailable columns:")
    print(importance_df.columns.tolist())
    raise ValueError(
        "Could not find 'feature' column in feature_importance.csv"
    )

if "importance" not in importance_df.columns:
    print("\nAvailable columns:")
    print(importance_df.columns.tolist())
    raise ValueError(
        "Could not find 'importance' column in feature_importance.csv"
    )

importance_df = importance_df.sort_values(
    by="importance",
    ascending=True
)

# Show top 15 features
top_features = importance_df.tail(15)

plt.figure(figsize=(10, 8))

plt.barh(
    top_features["feature"],
    top_features["importance"]
)

plt.xlabel("Feature Importance")
plt.ylabel("Feature")
plt.title("Top 15 Features - Random Forest")

plt.tight_layout()

importance_path = os.path.join(
    OUTPUT_DIR,
    "feature_importance_final.png"
)

plt.savefig(
    importance_path,
    dpi=300,
    bbox_inches="tight"
)

plt.close()

print(f"Saved: {importance_path}")

# ---------------------------------------------------------
# SUMMARY
# ---------------------------------------------------------

print("\n" + "=" * 60)
print("VISUALIZATION GENERATION COMPLETE")
print("=" * 60)

print("\nGenerated files:")

print(f"1. {cm_path}")
print(f"2. {roc_path}")
print(f"3. {importance_path}")

print("\nROC-AUC:", f"{roc_auc:.4f}")

print("\nConfusion Matrix:")
print(cm)

print("\nTop 15 Features:")

print(
    importance_df
    .sort_values(by="importance", ascending=False)
    .head(15)
    .to_string(index=False)
)