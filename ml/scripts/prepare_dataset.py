from pathlib import Path

import pandas as pd
from sklearn.model_selection import train_test_split


RANDOM_STATE = 42
TARGET = "ROBOT"
ID_COLUMN = "ID"

SCRIPT_DIR = Path(__file__).resolve().parent
ML_DIR = SCRIPT_DIR.parent

RAW_PATH = ML_DIR / "data" / "raw" / "simple_features.csv"
PROCESSED_DIR = ML_DIR / "data" / "processed"


def main():
    # ---------------------------------------------------------
    # 1. Load dataset
    # ---------------------------------------------------------
    if not RAW_PATH.exists():
        raise FileNotFoundError(
            f"Dataset not found: {RAW_PATH}\n"
            "Make sure simple_features.csv is inside "
            "ml/data/raw/"
        )

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Loading dataset from:\n{RAW_PATH}")

    df = pd.read_csv(RAW_PATH)

    print(f"\nOriginal dataset shape: {df.shape}")

    # ---------------------------------------------------------
    # 2. Validate required columns
    # ---------------------------------------------------------
    required_columns = {TARGET, ID_COLUMN}

    missing_columns = required_columns - set(df.columns)

    if missing_columns:
        raise ValueError(
            f"Missing required columns: {missing_columns}"
        )

    # ---------------------------------------------------------
    # 3. Check target values
    # ---------------------------------------------------------
    print("\nOriginal target distribution:")
    print(df[TARGET].value_counts())

    # Keep only valid binary labels
    before_filter = len(df)

    df = df[df[TARGET].isin([0, 1])].copy()

    removed_invalid = before_filter - len(df)

    print(
        f"\nRemoved rows with invalid ROBOT labels: "
        f"{removed_invalid}"
    )

    # ---------------------------------------------------------
    # 4. Remove duplicate rows
    # ---------------------------------------------------------
    before_duplicates = len(df)

    df = df.drop_duplicates().reset_index(drop=True)

    removed_duplicates = (
        before_duplicates - len(df)
    )

    print(
        f"Removed duplicate rows: "
        f"{removed_duplicates}"
    )

    # ---------------------------------------------------------
    # 5. Remove ID
    # ---------------------------------------------------------
    # ID is an identifier, not a behavioral feature.
    df = df.drop(columns=[ID_COLUMN])

    # ---------------------------------------------------------
    # 6. Separate features and target
    # ---------------------------------------------------------
    X = df.drop(columns=[TARGET])
    y = df[TARGET].astype(int)

    print(f"\nNumber of model features: {X.shape[1]}")

    # ---------------------------------------------------------
    # 7. First split
    #    70% training
    #    30% temporary
    # ---------------------------------------------------------
    X_train, X_temp, y_train, y_temp = train_test_split(
        X,
        y,
        test_size=0.30,
        stratify=y,
        random_state=RANDOM_STATE
    )

    # ---------------------------------------------------------
    # 8. Second split
    #    15% validation
    #    15% test
    # ---------------------------------------------------------
    X_validation, X_test, y_validation, y_test = (
        train_test_split(
            X_temp,
            y_temp,
            test_size=0.50,
            stratify=y_temp,
            random_state=RANDOM_STATE
        )
    )

    # ---------------------------------------------------------
    # 9. Handle missing values
    # ---------------------------------------------------------
    # IMPORTANT:
    # Calculate medians ONLY from training data.
    # Then apply the same medians to validation/test.
    numeric_columns = (
        X_train
        .select_dtypes(include="number")
        .columns
    )

    train_medians = X_train[numeric_columns].median()

    X_train[numeric_columns] = (
        X_train[numeric_columns]
        .fillna(train_medians)
    )

    X_validation[numeric_columns] = (
        X_validation[numeric_columns]
        .fillna(train_medians)
    )

    X_test[numeric_columns] = (
        X_test[numeric_columns]
        .fillna(train_medians)
    )

    # ---------------------------------------------------------
    # 10. Reattach target
    # ---------------------------------------------------------
    train = X_train.copy()
    train[TARGET] = y_train.values

    validation = X_validation.copy()
    validation[TARGET] = y_validation.values

    test = X_test.copy()
    test[TARGET] = y_test.values

    # Reset indexes
    train = train.reset_index(drop=True)
    validation = validation.reset_index(drop=True)
    test = test.reset_index(drop=True)

    # ---------------------------------------------------------
    # 11. Save datasets
    # ---------------------------------------------------------
    train_path = PROCESSED_DIR / "train.csv"
    validation_path = PROCESSED_DIR / "validation.csv"
    test_path = PROCESSED_DIR / "test.csv"

    train.to_csv(train_path, index=False)
    validation.to_csv(validation_path, index=False)
    test.to_csv(test_path, index=False)

    # ---------------------------------------------------------
    # 12. Print final information
    # ---------------------------------------------------------
    print("\n========================================")
    print("DATASET PREPARATION COMPLETE")
    print("========================================")

    print(f"\nTraining set:")
    print(f"Rows: {len(train)}")
    print(
        train[TARGET]
        .value_counts()
        .sort_index()
    )

    print(f"\nValidation set:")
    print(f"Rows: {len(validation)}")
    print(
        validation[TARGET]
        .value_counts()
        .sort_index()
    )

    print(f"\nTest set:")
    print(f"Rows: {len(test)}")
    print(
        test[TARGET]
        .value_counts()
        .sort_index()
    )

    print("\nMissing values after preprocessing:")

    print(
        "Train:",
        train.isna().sum().sum()
    )

    print(
        "Validation:",
        validation.isna().sum().sum()
    )

    print(
        "Test:",
        test.isna().sum().sum()
    )

    print("\nFiles created:")

    print(train_path)
    print(validation_path)
    print(test_path)


if __name__ == "__main__":
    main()