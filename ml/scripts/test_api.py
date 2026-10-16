import pandas as pd
import requests

# Load one real test sample
TEST_PATH = "data/processed/test.csv"

df = pd.read_csv(TEST_PATH)

# Take first test record
sample = df.iloc[0]

# Remove target
features = sample.drop("ROBOT").to_dict()

# Convert numeric values to float
features = {
    key: float(value)
    for key, value in features.items()
}

# Expected label from dataset
expected = int(sample["ROBOT"])

print("=" * 60)
print("TESTING FASTAPI BOT DETECTION")
print("=" * 60)

print("\nExpected dataset label:")
print(
    "Bot" if expected == 1 else "Human"
)

print("\nSending prediction request...")

response = requests.post(
    "http://127.0.0.1:8000/predict",
    json=features
)

print("\nHTTP Status:", response.status_code)

print("\nAPI Response:")

print(response.json())

print("\nExpected:")
print(expected)

print("\n" + "=" * 60)