AI-Based Web Log Analysis and Bot Detection System

An AI-powered web security application that analyzes server logs, classifies traffic as human or bot, identifies suspicious activity, and visualizes detection results through an interactive dashboard.

The system combines a machine learning model with behavioral analysis, REST APIs, persistent detection history, and alert management to help identify potentially automated web traffic.

Features

1. Machine Learning Bot Detection

- Random Forest classifier trained on labeled web-session data.
- Binary classification: Human ("0") or Bot ("1").
- Human and bot probability scores.
- Feature importance analysis.
- Model evaluation using Accuracy, Precision, Recall, F1 Score, and ROC-AUC.

2. Interactive Security Dashboard

- Total detections, human sessions, and bot sessions.
- Bot detection rate.
- Human-versus-bot distribution chart.
- Hourly detection trends for the last 24 hours.
- Recent detection history.
- Model performance metrics.

3. Batch CSV Analysis

- Upload CSV files containing extracted web-session features.
- Run predictions on multiple records.
- View human and bot classification counts.
- Save detection results to PostgreSQL.

4. Raw Server Log Analysis

- Upload supported ".log" and ".txt" files.
- Parse Apache/Nginx-style access logs.
- Group requests into sessions.
- Extract behavioral features from server logs.
- Analyze request frequency, repeated requests, HTTP errors, user agents, and referrer information.
- Compare ML predictions with rule-based behavioral risk assessments.

5. Alerts and Incident Management

- Generate alerts for high-risk activity.
- Assign severity levels based on behavioral risk.
- View suspicious IP addresses, user agents, and risk scores.
- Track alert status: Open, Investigating, or Resolved.
- Review alert history and analytics.

6. Persistent Detection History

- Store predictions and probability scores in PostgreSQL.
- Retrieve recent detection records.
- Generate detection analytics and hourly trends.

Technology Stack

Component| Technology
Frontend| React.js
Frontend tooling| Vite
Charts| Recharts
Backend| Node.js, Express.js
Machine learning API| Python, FastAPI
ML algorithm| Random Forest
Data processing| Pandas, NumPy
ML framework| scikit-learn
Database| PostgreSQL
Caching| Redis
Backend HTTP client| Axios
Model serialization| Joblib

System Architecture

                 User
                  |
                  v
          React.js Dashboard
                  |
                  v
          Node.js / Express
                  |
        +---------+----------+
        |         |          |
        v         v          v
   PostgreSQL   Redis    Log Analysis
        |                    |
        |                    v
        |             Feature Extraction
        |                    |
        |                    v
        |              FastAPI Service
        |                    |
        |                    v
        |              Random Forest
        |                    |
        +---------+----------+
                  |
                  v
       Predictions and Alerts
                  |
                  v
           React Dashboard

Machine Learning Dataset

The model was trained using the public Web robot detection - Server logs dataset.

Dataset source: https://zenodo.org/records/3477932

The dataset contains labeled web-session features, including request counts, timing statistics, HTTP response information, request methods, navigation behavior, and other traffic characteristics.

The target variable is "ROBOT":

- "0" — Human
- "1" — Bot

Model Evaluation

The final model was evaluated on a held-out test dataset.

Metric| Test Result
Accuracy| 98.04%
Precision| 93.39%
Recall| 97.08%
F1 Score| 95.20%
ROC-AUC| 99.63%

These metrics describe performance on the held-out dataset. Real-world performance may differ depending on traffic patterns, feature extraction, and deployment conditions.

Evaluation plots are available in "ml/reports/", including the confusion matrix, ROC curve, and feature importance chart.

Project Structure

ai-log-bot-detection/
├── backend/
│   ├── migrations/
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── modules/
│   │   │   ├── alerts/
│   │   │   ├── analytics/
│   │   │   ├── auth/
│   │   │   ├── detection/
│   │   │   ├── logs/
│   │   │   └── sessions/
│   │   ├── routes/
│   │   └── server.js
│   ├── tests/
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── styles/
│   │   └── main.jsx
│   └── package.json
├── ml/
│   ├── api.py
│   ├── models/
│   ├── data/
│   ├── scripts/
│   └── reports/
├── docker/
├── docs/
├── scripts/
├── docker-compose.yml
└── README.md

Prerequisites

Install the following before running the project:

- Node.js and npm
- Python 3
- PostgreSQL
- Docker Desktop, for the Redis container
- Git

Installation and Setup

1. Clone the repository

git clone <YOUR_GITHUB_REPOSITORY_URL>
cd ai-log-bot-detection

2. Configure the backend

cd backend
npm install

Create a ".env" file using ".env.example" as a template.

Configure your database connection, Redis URL, port, CORS origin, JWT secrets, and ML service URL.

Example configuration:

NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/bot_detection
DB_POOL_MAX=10
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=replace_with_a_long_random_secret
JWT_REFRESH_SECRET=replace_with_another_long_random_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
ML_SERVICE_URL=http://127.0.0.1:8000
CORS_ORIGIN=http://localhost:5173

Create the "bot_detection" PostgreSQL database and apply the SQL migrations provided in "backend/migrations/".

Do not commit your actual ".env" file or credentials to GitHub.

3. Start Redis

From the project root, start the Redis container if the included Compose configuration defines it:

docker compose up -d redis

If the Compose service has a different name, use that service name instead.

4. Start the machine learning service

Install the dependencies specified in the ML requirements file, if present.

cd ml
python -m pip install -r requirements.txt

Start FastAPI:

python -m uvicorn api:app --reload --port 8000

The API should be available at:

"http://127.0.0.1:8000"

Health check:

"http://127.0.0.1:8000/health"

5. Start the backend

Open another terminal:

cd backend
npm run dev

The backend should be available at:

"http://localhost:5000"

Check the API root:

"http://localhost:5000/api"

6. Start the frontend

Open another terminal:

cd frontend
npm install
npm run dev

Open the Vite URL displayed in the terminal, typically:

"http://localhost:5173"

Keep PostgreSQL, Redis, FastAPI, Express, and Vite running while using the complete application.

API Endpoints

The following endpoints are implemented in the project:

Method| Endpoint| Purpose
GET| "/api"| Backend status
POST| "/api/detection/predict"| Predict and save a detection
GET| "/api/detection/history"| Retrieve detection history
GET| "/api/detection/analytics"| Retrieve detection analytics
GET| "/api/detection/trends"| Retrieve hourly detection trends
POST| "/api/logs/upload"| Upload and analyze a CSV
POST| "/api/logs/upload-raw"| Upload and analyze raw logs
GET| "/api/alerts"| Retrieve alerts
GET| "/api/alerts/analytics"| Retrieve alert analytics
PATCH| "/api/alerts/:id/status"| Update an alert's status

The prediction endpoint communicates with FastAPI, while detection history and analytics are persisted in PostgreSQL.

How It Works

1. The user submits a session's features, a CSV file, or a raw server log.
2. The backend validates and processes the supplied data.
3. Raw logs are parsed and transformed into model features.
4. The FastAPI service loads the trained Random Forest model and generates predictions.
5. The backend stores applicable detection results in PostgreSQL.
6. Behavioral analysis identifies suspicious patterns and calculates a risk score.
7. High-risk activity can generate an alert.
8. The React dashboard displays classifications, probabilities, trends, history, and alerts.

Security and Limitations

- Keep environment variables and secrets out of version control.
- Use ".env.example" for safe configuration templates.
- The displayed model metrics are dataset evaluation results, not a guarantee of production accuracy.
- Raw-log feature extraction uses practical approximations for some dataset features because ordinary access logs do not contain every original training feature.
- Rule-based risk scores complement ML predictions and should not be interpreted as definitive proof of malicious activity.
- Production deployment should include authentication and authorization, request validation, rate limiting, secure secret management, monitoring, and appropriate data-retention controls.

Future Improvements

- Real-time log ingestion and streaming analysis.
- Configurable alert thresholds and notifications.
- Advanced sessionization and behavioral features.
- Authentication and role-based access control.
- Model comparison, drift monitoring, and periodic retraining.
- Production deployment with container orchestration and monitoring.

Author
Ganesh k s

AI-Based Web Log Analysis and Bot Detection System

Developed as an academic project exploring machine learning, backend engineering, log analysis, and web security.

License

Choose an appropriate open-source license before distributing this project publicly. If no license is added, standard copyright restrictions apply.
