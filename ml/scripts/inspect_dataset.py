from pathlib import Path
import pandas as pd

DATASET_PATH = Path(__file__).resolve().parents[1] / "data" / "raw" / "simple_features.csv"

def main():
    if not DATASET_PATH.exists():
        raise FileNotFoundError(
            f"Dataset not found at {DATASET_PATH}. "
            "Download simple_features.csv from the official Zenodo dataset page first."
        )

    df = pd.read_csv(DATASET_PATH)

    print("\n=== DATASET SHAPE ===")
    print(df.shape)

    print("\n=== COLUMNS ===")
    for column in df.columns:
        print(column)

    print("\n=== DATA TYPES ===")
    print(df.dtypes)

    print("\n=== MISSING VALUES ===")
    print(df.isna().sum().sort_values(ascending=False).head(20))

    print("\n=== POSSIBLE TARGET COLUMNS ===")
    candidates = [
        c for c in df.columns
        if any(term in c.lower() for term in ["robot", "bot", "label", "target", "class"])
    ]
    print(candidates)

    print("\n=== SAMPLE ===")
    print(df.head(5).to_string())

if __name__ == "__main__":
    main()
