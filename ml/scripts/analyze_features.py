from pathlib import Path

import pandas as pd


TARGET = "ROBOT"

SCRIPT_DIR = Path(__file__).resolve().parent
ML_DIR = SCRIPT_DIR.parent

TRAIN_PATH = ML_DIR / "data" / "processed" / "train.csv"
OUTPUT_DIR = ML_DIR / "reports"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def main():
    print("========================================")
    print("FEATURE ANALYSIS")
    print("========================================")

    df = pd.read_csv(TRAIN_PATH)

    print(f"\nDataset shape: {df.shape}")

    X = df.drop(columns=[TARGET])
    y = df[TARGET]

    # ---------------------------------------------------------
    # 1. Missing values
    # ---------------------------------------------------------

    print("\n========================================")
    print("MISSING VALUES")
    print("========================================")

    missing = df.isna().sum()

    print(
        missing[missing > 0]
        if missing.sum() > 0
        else "No missing values."
    )

    # ---------------------------------------------------------
    # 2. Feature cardinality
    # ---------------------------------------------------------

    print("\n========================================")
    print("FEATURE CARDINALITY")
    print("========================================")

    cardinality = (
        X.nunique()
        .sort_values()
        .to_frame("unique_values")
    )

    print(cardinality.to_string())

    # ---------------------------------------------------------
    # 3. Correlation with target
    # ---------------------------------------------------------

    print("\n========================================")
    print("CORRELATION WITH ROBOT")
    print("========================================")

    correlations = (
        df.corr(numeric_only=True)[TARGET]
        .drop(TARGET)
        .sort_values(
            key=lambda x: x.abs(),
            ascending=False
        )
    )

    print(correlations.to_string())

    correlations_df = correlations.to_frame(
        "correlation_with_ROBOT"
    )

    correlations_df.to_csv(
        OUTPUT_DIR / "target_correlations.csv"
    )

    # ---------------------------------------------------------
    # 4. Highly correlated feature pairs
    # ---------------------------------------------------------

    print("\n========================================")
    print("HIGHLY CORRELATED FEATURE PAIRS")
    print("========================================")

    feature_corr = X.corr()

    pairs = []

    columns = feature_corr.columns

    for i in range(len(columns)):
        for j in range(i + 1, len(columns)):

            correlation = feature_corr.iloc[i, j]

            if abs(correlation) >= 0.90:
                pairs.append(
                    {
                        "feature_1": columns[i],
                        "feature_2": columns[j],
                        "correlation": correlation,
                    }
                )

    pairs_df = pd.DataFrame(pairs)

    if pairs_df.empty:
        print(
            "No feature pairs with "
            "|correlation| >= 0.90"
        )
    else:
        pairs_df = pairs_df.sort_values(
            "correlation",
            key=lambda x: x.abs(),
            ascending=False,
        )

        print(
            pairs_df.to_string(index=False)
        )

        pairs_df.to_csv(
            OUTPUT_DIR /
            "highly_correlated_features.csv",
            index=False,
        )

    # ---------------------------------------------------------
    # 5. UNASSIGNED investigation
    # ---------------------------------------------------------

    feature = "UNASSIGNED"

    print("\n========================================")
    print("UNASSIGNED ANALYSIS")
    print("========================================")

    if feature in df.columns:

        print("\nOverall statistics:")
        print(
            df[feature].describe()
        )

        print("\nHuman sessions:")
        print(
            df[df[TARGET] == 0][feature]
            .describe()
        )

        print("\nBot sessions:")
        print(
            df[df[TARGET] == 1][feature]
            .describe()
        )

        print("\nMean by class:")

        print(
            df.groupby(TARGET)[feature]
            .mean()
        )

        print("\nMedian by class:")

        print(
            df.groupby(TARGET)[feature]
            .median()
        )

    # ---------------------------------------------------------
    # 6. Feature statistics by class
    # ---------------------------------------------------------

    print("\n========================================")
    print("CLASS-WISE FEATURE STATISTICS")
    print("========================================")

    statistics = []

    for feature in X.columns:

        human = df[df[TARGET] == 0][feature]
        bot = df[df[TARGET] == 1][feature]

        statistics.append(
            {
                "feature": feature,
                "human_mean": human.mean(),
                "bot_mean": bot.mean(),
                "human_median": human.median(),
                "bot_median": bot.median(),
            }
        )

    statistics_df = pd.DataFrame(statistics)

    statistics_df.to_csv(
        OUTPUT_DIR / "class_feature_statistics.csv",
        index=False,
    )

    print(
        f"\nSaved class statistics to:"
        f"\n{OUTPUT_DIR / 'class_feature_statistics.csv'}"
    )

    print("\n========================================")
    print("FEATURE ANALYSIS COMPLETE")
    print("========================================")


if __name__ == "__main__":
    main()