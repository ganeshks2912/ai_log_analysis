import sys
from pathlib import Path

import pandas as pd


MODEL_FEATURES = [
    "NUMBER_OF_REQUESTS",
    "TOTAL_DURATION",
    "AVERAGE_TIME",
    "STANDARD_DEVIATION",
    "REPEATED_REQUESTS",
    "HTTP_RESPONSE_2XX",
    "HTTP_RESPONSE_3XX",
    "HTTP_RESPONSE_4XX",
    "HTTP_RESPONSE_5XX",
    "GET_METHOD",
    "POST_METHOD",
    "HEAD_METHOD",
    "OTHER_METHOD",
    "NIGHT",
    "UNASSIGNED",
    "IMAGES",
    "TOTAL_HTML",
    "HTML_TO_IMAGE",
    "HTML_TO_CSS",
    "HTML_TO_JS",
    "WIDTH",
    "DEPTH",
    "STD_DEPTH",
    "CONSECUTIVE",
    "DATA",
    "PPI",
    "SF_REFERRER",
    "SF_FILETYPE",
    "MAX_BARRAGE",
    "PENALTY",
]


def load_training_data():
    path = Path("ml/data/processed/train.csv")

    if not path.exists():
        raise FileNotFoundError(
            f"Training dataset not found: {path}"
        )

    return pd.read_csv(path)


def load_raw_feature_file(path):
    path = Path(path)

    if not path.exists():
        raise FileNotFoundError(
            f"Raw feature file not found: {path}"
        )

    import json

    with path.open("r", encoding="utf-8") as file:
        data = json.load(file)

    if "rows" not in data:
        raise ValueError(
            "Raw feature JSON does not contain 'rows'."
        )

    rows = data["rows"]

    if not isinstance(rows, list):
        raise ValueError(
            "'rows' must be a list."
        )

    if len(rows) == 0:
        raise ValueError(
            "No raw feature rows found."
        )

    return pd.DataFrame.from_records(rows)


def print_comparison(training, raw):

    print("\n" + "=" * 100)
    print("TRAINING DATA vs RAW LOG FEATURE COMPARISON")
    print("=" * 100)

    print(
        f"\nTraining rows : {len(training)}"
    )

    print(
        f"Raw sessions  : {len(raw)}"
    )

    for row_index, raw_row in raw.iterrows():

        print("\n")
        print("-" * 100)
        print(
            f"RAW SESSION {row_index + 1}"
        )
        print("-" * 100)

        header = (
            f"{'FEATURE':<25}"
            f"{'TRAIN MEDIAN':>15}"
            f"{'TRAIN P95':>15}"
            f"{'RAW VALUE':>15}"
            f"{'STATUS':>12}"
        )

        print(header)
        print("-" * 100)

        outlier_count = 0
        edge_count = 0

        for feature in MODEL_FEATURES:

            if feature not in training.columns:
                continue

            if feature not in raw.columns:
                continue

            train_values = pd.to_numeric(
                training[feature],
                errors="coerce",
            ).dropna()

            raw_value = pd.to_numeric(
                pd.Series([raw_row[feature]]),
                errors="coerce",
            ).iloc[0]

            if train_values.empty:
                continue

            p01 = train_values.quantile(0.01)
            p05 = train_values.quantile(0.05)
            p95 = train_values.quantile(0.95)
            p99 = train_values.quantile(0.99)

            if pd.isna(raw_value):
                status = "INVALID"

            elif (
                raw_value < p01
                or raw_value > p99
            ):
                status = "OUTLIER"
                outlier_count += 1

            elif (
                raw_value < p05
                or raw_value > p95
            ):
                status = "EDGE"
                edge_count += 1

            else:
                status = "OK"

            print(
                f"{feature:<25}"
                f"{train_values.median():>15.4f}"
                f"{p95:>15.4f}"
                f"{raw_value:>15.4f}"
                f"{status:>12}"
            )

        print("-" * 100)

        print(
            f"OUTLIERS    : {outlier_count}"
        )

        print(
            f"EDGE VALUES : {edge_count}"
        )

    print("\n" + "=" * 100)
    print("COMPARISON COMPLETE")
    print("=" * 100)


def main():

    if len(sys.argv) != 2:
        print(
            "Usage:"
        )

        print(
            "python ml/scripts/compare_raw_features.py "
            "<raw_features.json>"
        )

        sys.exit(1)

    raw_path = sys.argv[1]

    try:
        training = load_training_data()

        raw = load_raw_feature_file(
            raw_path
        )

        missing = [
            feature
            for feature in MODEL_FEATURES
            if feature not in raw.columns
        ]

        if missing:
            print(
                "\nMissing raw features:"
            )

            for feature in missing:
                print(
                    f"  - {feature}"
                )

            sys.exit(1)

        print_comparison(
            training,
            raw,
        )

    except Exception as error:

        print(
            f"\nERROR: {error}"
        )

        sys.exit(1)


if __name__ == "__main__":
    main()