# Public Dataset

## Selected Dataset

**Web robot detection - Server logs**

Source: Zenodo  
DOI: 10.5281/zenodo.3477932

The dataset was created from server logs of the search engine of the Library and Information Center of Aristotle University of Thessaloniki. It covers March 1–31, 2018 and contains 4,091,155 requests, 27,061 unique IP addresses and 3,441 unique user-agent strings.

The dataset provides:
- `simple_features.csv` — processed, labeled session-level features
- `semantic_features.csv` — processed semantic features
- `public_v2.json` — original anonymized server logs

For this project, the initial ML pipeline uses `simple_features.csv` because it is substantially smaller and already contains labeled session-level data suitable for reproducible model development.

## Important methodology

We will NOT claim that every feature in our production log parser is directly present in the training dataset.

We will:
1. Inspect the dataset schema.
2. Identify the official target label.
3. Remove identifiers/leakage fields.
4. Handle missing values and categorical fields.
5. Split data into train/validation/test sets.
6. Train Random Forest.
7. Evaluate with accuracy, precision, recall, F1 and ROC-AUC.
8. Save the trained model and preprocessing metadata.
9. Later build a production feature extractor for uploaded logs and map compatible features into the model input schema.

## Dataset download

Official dataset page:
https://zenodo.org/records/3477932

Expected local path:
`ml/data/raw/simple_features.csv`

Do not commit the dataset to Git.
