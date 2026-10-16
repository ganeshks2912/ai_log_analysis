import json
import sys
from pathlib import Path


EXPECTED_FEATURES = [
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


def validate_features(features):
    print("\n=== RAW LOG FEATURE VALIDATION ===\n")

    missing = [
        feature
        for feature in EXPECTED_FEATURES
        if feature not in features
    ]

    extra = [
        feature
        for feature in features
        if feature not in EXPECTED_FEATURES
    ]

    invalid = []

    for feature in EXPECTED_FEATURES:
        if feature not in features:
            continue

        value = features[feature]

        if not isinstance(value, (int, float)):
            invalid.append(
                (feature, value, "not numeric")
            )
            continue

        if value != value:
            invalid.append(
                (feature, value, "NaN")
            )

    print(f"Expected features : {len(EXPECTED_FEATURES)}")
    print(f"Received features : {len(features)}")

    print("\nMissing features:")

    if missing:
        for feature in missing:
            print(f"  - {feature}")
    else:
        print("  None")

    print("\nUnexpected features:")

    if extra:
        for feature in extra:
            print(f"  - {feature}")
    else:
        print("  None")

    print("\nInvalid values:")

    if invalid:
        for feature, value, reason in invalid:
            print(
                f"  - {feature}: {value} ({reason})"
            )
    else:
        print("  None")

    print("\nFeature values:")

    for feature in EXPECTED_FEATURES:
        if feature in features:
            print(
                f"  {feature:<25} {features[feature]}"
            )

    if (
        not missing
        and not extra
        and not invalid
    ):
        print(
            "\nSTATUS: PASS - all 30 ML features are valid."
        )
        return True

    print(
        "\nSTATUS: FAIL - feature validation requires attention."
    )

    return False


def main():
    if len(sys.argv) != 2:
        print(
            "Usage: python validate_raw_features.py <json_file>"
        )
        sys.exit(1)

    json_path = Path(sys.argv[1])

    if not json_path.exists():
        print(
            f"File not found: {json_path}"
        )
        sys.exit(1)

    try:
        with json_path.open(
            "r",
            encoding="utf-8",
        ) as file:
            data = json.load(file)
    except json.JSONDecodeError as error:
        print(
            f"Invalid JSON: {error}"
        )
        sys.exit(1)

    features = data.get("features")

    if not isinstance(features, dict):
        print(
            "JSON must contain a 'features' object."
        )
        sys.exit(1)

    success = validate_features(features)

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()