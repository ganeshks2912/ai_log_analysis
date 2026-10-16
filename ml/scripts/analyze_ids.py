from pathlib import Path

import pandas as pd


SCRIPT_DIR = Path(__file__).resolve().parent
ML_DIR = SCRIPT_DIR.parent

DATA_PATH = ML_DIR / "data" / "raw" / "simple_features.csv"


def main():
    df = pd.read_csv(DATA_PATH)

    ids = df["ID"].astype(str)

    print("========================================")
    print("ID STRUCTURE ANALYSIS")
    print("========================================")

    print(f"\nTotal IDs: {len(ids)}")
    print(f"Unique IDs: {ids.nunique()}")
    print(f"ID length: {ids.str.len().unique()}")

    # ---------------------------------------------------------
    # Check prefixes
    # ---------------------------------------------------------

    for length in [2, 3, 4, 5, 6, 8, 10, 12]:

        prefix_counts = (
            ids.str[:length]
            .value_counts()
        )

        duplicated_prefixes = (
            prefix_counts[prefix_counts > 1]
        )

        print(
            f"\nPrefix length {length}:"
        )

        print(
            f"Unique prefixes: "
            f"{prefix_counts.size}"
        )

        print(
            f"Prefixes occurring more than once: "
            f"{len(duplicated_prefixes)}"
        )

        if len(duplicated_prefixes) > 0:

            print(
                duplicated_prefixes
                .head(10)
                .to_string()
            )

    # ---------------------------------------------------------
    # Check suffixes
    # ---------------------------------------------------------

    for length in [2, 3, 4, 5, 6, 8, 10]:

        suffix_counts = (
            ids.str[-length:]
            .value_counts()
        )

        duplicated_suffixes = (
            suffix_counts[suffix_counts > 1]
        )

        print(
            f"\nSuffix length {length}:"
        )

        print(
            f"Unique suffixes: "
            f"{suffix_counts.size}"
        )

        print(
            f"Suffixes occurring more than once: "
            f"{len(duplicated_suffixes)}"
        )

        if len(duplicated_suffixes) > 0:

            print(
                duplicated_suffixes
                .head(10)
                .to_string()
            )

    # ---------------------------------------------------------
    # Character-level information
    # ---------------------------------------------------------

    print("\n========================================")
    print("CHARACTER ANALYSIS")
    print("========================================")

    print(
        "\nCharacters used:"
    )

    chars = sorted(
        set("".join(ids))
    )

    print("".join(chars))

    print(
        f"\nNumber of unique characters: "
        f"{len(chars)}"
    )

    # ---------------------------------------------------------
    # Target distribution by common prefix
    # ---------------------------------------------------------

    print("\n========================================")
    print("TARGET DISTRIBUTION BY PREFIX")
    print("========================================")

    for length in [2, 3, 4, 5]:

        grouped = (
            df.assign(
                prefix=ids.str[:length]
            )
            .groupby("prefix")["ROBOT"]
            .agg(
                count="count",
                robot_rate="mean"
            )
            .sort_values(
                "count",
                ascending=False
            )
        )

        print(
            f"\nTop prefixes "
            f"(length={length}):"
        )

        print(
            grouped.head(10).to_string()
        )

    print("\n========================================")
    print("ID ANALYSIS COMPLETE")
    print("========================================")


if __name__ == "__main__":
    main()