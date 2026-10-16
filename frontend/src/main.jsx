import React, { useEffect, useState } from "react";



import ReactDOM from "react-dom/client";



import axios from "axios";



import {

  PieChart,

  Pie,

  Cell,

  Tooltip,

  ResponsiveContainer,

  Legend,

  BarChart,

  Bar,

  LineChart,

  Line,

  XAxis,

  YAxis,

  CartesianGrid,

} from "recharts";



import "./styles/index.css";



const API_URL = "http\://localhost:5000/api";



const humanSample = {

  NUMBER_OF_REQUESTS: 10,

  TOTAL_DURATION: 100,

  AVERAGE_TIME: 10,

  STANDARD_DEVIATION: 2,

  REPEATED_REQUESTS: 1,

  HTTP_RESPONSE_2XX: 8,

  HTTP_RESPONSE_3XX: 1,

  HTTP_RESPONSE_4XX: 1,

  HTTP_RESPONSE_5XX: 0,

  GET_METHOD: 10,

  POST_METHOD: 0,

  HEAD_METHOD: 0,

  OTHER_METHOD: 0,

  NIGHT: 0,

  UNASSIGNED: 0.1,

  IMAGES: 5,

  TOTAL_HTML: 3,

  HTML_TO_IMAGE: 0.6,

  HTML_TO_CSS: 1,

  HTML_TO_JS: 1,

  WIDTH: 10,

  DEPTH: 3,

  STD_DEPTH: 1,

  CONSECUTIVE: 2,

  DATA: 100,

  PPI: 1,

  SF_REFERRER: 0.5,

  SF_FILETYPE: 0.5,

  MAX_BARRAGE: 2,

  PENALTY: 0,

};



const botSample = {

  NUMBER_OF_REQUESTS: 20,

  TOTAL_DURATION: 6668,

  AVERAGE_TIME: 350.94736,

  STANDARD_DEVIATION: 383.78467,

  REPEATED_REQUESTS: 0,

  HTTP_RESPONSE_2XX: 0.95,

  HTTP_RESPONSE_3XX: 0,

  HTTP_RESPONSE_4XX: 0.05,

  HTTP_RESPONSE_5XX: 0,

  GET_METHOD: 1,

  POST_METHOD: 0,

  HEAD_METHOD: 0,

  OTHER_METHOD: 0,

  NIGHT: 0,

  UNASSIGNED: 1,

  IMAGES: 0,

  TOTAL_HTML: 0.95,

  HTML_TO_IMAGE: 0,

  HTML_TO_CSS: 0,

  HTML_TO_JS: 0,

  WIDTH: 17,

  DEPTH: 4,

  STD_DEPTH: 0.4442616583,

  CONSECUTIVE: 0.15,

  DATA: 199979,

  PPI: 13.3,

  SF_REFERRER: 0,

  SF_FILETYPE: 0.0526315789,

  MAX_BARRAGE: 1,

  PENALTY: 0,

};



const modelMetrics = [

  { name: "Accuracy", value: 98.04 },

  { name: "Precision", value: 93.39 },

  { name: "Recall", value: 97.08 },

  { name: "F1 Score", value: 95.2 },

  { name: "ROC-AUC", value: 99.63 },

];



const featureImportance = [

  { name: "UNASSIGNED", value: 31.16 },

  { name: "DATA", value: 7.76 },

  { name: "MAX_BARRAGE", value: 7.5 },

  { name: "SF_REFERRER", value: 6.79 },

  { name: "REQUESTS", value: 6.75 },

  { name: "HTML_TO_IMAGE", value: 5.52 },

  { name: "HTML_TO_CSS", value: 4.19 },

  { name: "WIDTH", value: 3.77 },

  { name: "DEPTH", value: 3.66 },

  { name: "PPI", value: 2.8 },

];



function App() {

  const [history, setHistory] = useState([]);

  const [analytics, setAnalytics] = useState(null);



  const [form, setForm] = useState(humanSample);

  const [result, setResult] = useState(null);



  const [loading, setLoading] = useState(true);

  const [analyzing, setAnalyzing] = useState(false);



  const [error, setError] = useState("");



  const [selectedSample, setSelectedSample] =

    useState("Human");



  const [selectedFile, setSelectedFile] =

    useState(null);



  const [uploading, setUploading] =

    useState(false);



  const [batchResult, setBatchResult] =

    useState(null);



  const [selectedRawFile, setSelectedRawFile] =

    useState(null);



  const [uploadingRaw, setUploadingRaw] =

    useState(false);



  const [rawLogResult, setRawLogResult] =

    useState(null);



  
  const [alerts, setAlerts] = useState([]);
  const [alertAnalytics, setAlertAnalytics] = useState(null);
  const [alertFilter, setAlertFilter] = useState("ALL");
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [trends, setTrends] = useState([]);

const fetchDashboardData = async () => {

    try {

      setLoading(true);

      setError("");



      const [

        historyResponse,

        analyticsResponse,

        trendsResponse,

      ] = await Promise.all([

        axios.get(

          `${API_URL}/detection/history?limit=50`

        ),



        axios.get(

          `${API_URL}/detection/analytics`

        ),



        axios.get(

          `${API_URL}/detection/trends`

        ),

      ]);



      setHistory(

        historyResponse.data.data || []

      );



      setAnalytics(

        analyticsResponse.data.data || null

      );



      setTrends(

        trendsResponse.data.data || []

      );

    } catch (err) {

      console.error(err);



      setError(

        "Unable to connect to the backend. Make sure Node.js is running."

      );

    } finally {

      setLoading(false);

    }

  };
  const fetchAlerts = async (status = alertFilter) => {
    try {
      setAlertsLoading(true);

      const params =
        status && status !== "ALL"
          ? { status }
          : {};

      const [alertsResponse, analyticsResponse] =
        await Promise.all([
          axios.get(`${API_URL}/alerts`, { params }),
          axios.get(`${API_URL}/alerts/analytics`),
        ]);

      setAlerts(alertsResponse.data.data || []);
      setAlertAnalytics(
        analyticsResponse.data.data || null
      );
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
    } finally {
      setAlertsLoading(false);
    }
  };

  const updateAlertStatus = async (alertId, status) => {
    try {
      await axios.patch(
        `${API_URL}/alerts/${alertId}/status`,
        { status }
      );

      await fetchAlerts(alertFilter);
    } catch (err) {
      console.error("Failed to update alert status:", err);

      setError(
        err.response?.data?.message ||
          "Unable to update alert status."
      );
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchAlerts("ALL");
  }, []);

  useEffect(() => {
    fetchAlerts(alertFilter);
  }, [alertFilter]);




  const loadSample = (sample, name) => {

    setForm({ ...sample });

    setSelectedSample(name);

    setResult(null);

    setError("");

  };



  const handleChange = (event) => {

    const {

      name,

      value,

    } = event.target;



    setForm((previous) => ({

      ...previous,

      [name]: Number(value),

    }));



    setSelectedSample("Custom");

  };



  const analyzeSession = async (event) => {

    event.preventDefault();



    try {

      setAnalyzing(true);

      setError("");

      setResult(null);



      const response = await axios.post(

        `${API_URL}/detection/predict`,

        form

      );



      setResult(

        response.data.data

      );



      await fetchDashboardData();
      await fetchAlerts(alertFilter);

    } catch (err) {

      console.error(err);



      setError(

        err.response?.data?.message ||

          "Prediction failed. Make sure the backend and ML service are running."

      );

    } finally {

      setAnalyzing(false);

    }

  };



  const handleFileChange = (event) => {

    const file =

      event.target.files?.[0] || null;



    setSelectedFile(file);

    setBatchResult(null);

    setError("");

  };



  const uploadCsv = async () => {

    if (!selectedFile) {

      setError(

        "Please select a CSV file first."

      );



      return;

    }



    if (

      !selectedFile.name

        .toLowerCase()

        .endsWith(".csv")

    ) {

      setError(

        "Only CSV files are allowed."

      );



      return;

    }



    try {

      setUploading(true);

      setError("");

      setBatchResult(null);



      const formData = new FormData();



      formData.append(

        "file",

        selectedFile

      );



      const response = await axios.post(

        `${API_URL}/logs/upload`,

        formData,

        {

          headers: {

            "Content-Type":

              "multipart/form-data",

          },

        }

      );



      setBatchResult(

        response.data.data

      );



      await fetchDashboardData();
      await fetchAlerts(alertFilter);

    } catch (err) {

      console.error(err);



      setError(

        err.response?.data?.message ||

          "CSV upload failed. Check the file format and backend."

      );

    } finally {

      setUploading(false);

    }

  };



  const handleRawFileChange = (event) => {

    const file =

      event.target.files?.[0] || null;



    setSelectedRawFile(file);

    setRawLogResult(null);

    setError("");

  };



  const uploadRawLog = async () => {

    if (!selectedRawFile) {

      setError(

        "Please select a raw log file first."

      );



      return;

    }



    const fileName =

      selectedRawFile.name.toLowerCase();



    if (

      !fileName.endsWith(".log") &&

      !fileName.endsWith(".txt")

    ) {

      setError(

        "Only .log and .txt files are allowed."

      );



      return;

    }



    try {

      setUploadingRaw(true);

      setError("");

      setRawLogResult(null);



      const formData = new FormData();



      formData.append(

        "file",

        selectedRawFile

      );



      const response = await axios.post(

        `${API_URL}/logs/upload-raw`,

        formData,

        {

          headers: {

            "Content-Type":

              "multipart/form-data",

          },

        }

      );



      setRawLogResult(

        response.data.data

      );



      await fetchDashboardData();
      await fetchAlerts(alertFilter);

    } catch (err) {

      console.error(err);



      setError(

        err.response?.data?.message ||

          "Raw log upload failed. Check the log format and backend."

      );

    } finally {

      setUploadingRaw(false);

    }

  };



  const trendChartData = trends.map((item) => ({
    time: item.time_bucket
      ? new Date(item.time_bucket).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "",
    total: Number(item.total_detections ?? 0),
    human: Number(item.human_detections ?? 0),
    bot: Number(item.bot_detections ?? 0),
  }));



  const chartData = [

    {

      name: "Human",

      value: Number(

        analytics?.human_detections ?? 0

      ),

    },

    {

      name: "Bot",

      value: Number(

        analytics?.bot_detections ?? 0

      ),

    },

  ];



  return (

    <main className="app">



      {/* HEADER */}



      <header className="header">



        <div>

          <p className="eyebrow">

            AI-POWERED SECURITY

          </p>



          <h1>

            Web Log Bot Detection

          </h1>



          <p className="subtitle">

            Analyze web sessions and identify

            automated bot traffic using machine

            learning.

          </p>

        </div>



        <button

          className="refresh-button"

          onClick={fetchDashboardData}

        >

          Refresh

        </button>



      </header>



      {error && (

        <div className="error-banner">

          {error}

        </div>

      )}



      {/* STATISTICS */}



      <section className="stats-grid">



        <div className="stat-card">

          <span>Total Detections</span>



          <strong>

            {analytics?.total_detections ?? 0}

          </strong>

        </div>



        <div className="stat-card">

          <span>Human Sessions</span>



          <strong>

            {analytics?.human_detections ?? 0}

          </strong>

        </div>



        <div className="stat-card">

          <span>Bot Sessions</span>



          <strong>

            {analytics?.bot_detections ?? 0}

          </strong>

        </div>



        <div className="stat-card">

          <span>Bot Detection Rate</span>



          <strong>

            {analytics?.bot_detection_rate ??

              "0.00"}

            %

          </strong>

        </div>



      </section>



      {/* DISTRIBUTION */}



      <section className="panel chart-panel">



        <div className="panel-header">



          <h2>

            Detection Distribution

          </h2>



          <p>

            Distribution of detected human and

            automated sessions.

          </p>



        </div>



        <div className="chart-container">



          {chartData.some(

            (item) => item.value > 0

          ) ? (



            <ResponsiveContainer

              width="100%"

              height={320}

            >



              <PieChart>



                <Pie

                  data={chartData}

                  dataKey="value"

                  nameKey="name"

                  cx="50%"

                  cy="50%"

                  outerRadius={105}

                  innerRadius={55}

                  paddingAngle={3}

                  label

                >



                  <Cell fill="#18794e" />



                  <Cell fill="#c0392b" />



                </Pie>



                <Tooltip />



                <Legend />



              </PieChart>



            </ResponsiveContainer>



          ) : (



            <div className="empty-state">

              No detection data available yet.

            </div>



          )}



        </div>



      </section>



      {/* DETECTION TRENDS */}



      <section className="panel chart-panel">

        <div className="panel-header">

          <h2>
            Detection Trends
          </h2>

          <p>
            Hourly human and bot detections over the last 24 hours.
          </p>

        </div>

        <div className="chart-container">

          {trendChartData.length > 0 ? (

            <ResponsiveContainer
              width="100%"
              height={320}
            >

              <LineChart
                data={trendChartData}
                margin={{
                  top: 10,
                  right: 20,
                  left: 0,
                  bottom: 10,
                }}
              >

                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="time" />

                <YAxis allowDecimals={false} />

                <Tooltip />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="total"
                  name="Total"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />

                <Line
                  type="monotone"
                  dataKey="human"
                  name="Human"
                  stroke="#18794e"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />

                <Line
                  type="monotone"
                  dataKey="bot"
                  name="Bot"
                  stroke="#c0392b"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />

              </LineChart>

            </ResponsiveContainer>

          ) : (

            <div className="empty-state">
              No detection trend data available yet.
            </div>

          )}

        </div>

      </section>



      {/* CSV UPLOAD */}



      <section className="panel upload-panel">



        <div className="panel-header">



          <h2>

            Batch Log Analysis

          </h2>



          <p>

            Upload a CSV containing extracted

            web-session features and analyze

            multiple sessions at once.

          </p>



        </div>



        <div className="upload-area">



          <div className="upload-input-wrapper">



            <input

              id="csv-file"

              type="file"

              accept=".csv"

              onChange={handleFileChange}

            />



            <label

              htmlFor="csv-file"

              className="file-label"

            >

              Choose CSV File

            </label>



            <span className="selected-file">

              {selectedFile

                ? selectedFile.name

                : "No file selected"}

            </span>



          </div>



          <button

            type="button"

            className="upload-button"

            onClick={uploadCsv}

            disabled={

              uploading ||

              !selectedFile

            }

          >

            {uploading

              ? "Processing..."

              : "Upload & Analyze"}

          </button>



        </div>



        <div className="upload-info">



          <span>

            Maximum file size: 10 MB

          </span>



          <span>

            Required format: CSV with 30

            model features

          </span>



        </div>



      </section>



      {/* BATCH RESULT */}



      {batchResult && (



        <section className="panel batch-result-panel">



          <div className="panel-header">



            <h2>

              Batch Analysis Results

            </h2>



            <p>

              The uploaded sessions were

              processed by the Random Forest

              classifier.

            </p>



          </div>



          <div className="batch-summary">



            <div className="batch-card">



              <span>

                Total Processed

              </span>



              <strong>

                {batchResult.total_rows}

              </strong>



            </div>



            <div className="batch-card human-summary">



              <span>

                Human

              </span>



              <strong>

                {batchResult.human_count}

              </strong>



            </div>



            <div className="batch-card bot-summary">



              <span>

                Bot

              </span>



              <strong>

                {batchResult.bot_count}

              </strong>



            </div>



          </div>



          <div className="table-wrapper">



            <table>



              <thead>



                <tr>



                  <th>

                    Row

                  </th>



                  <th>

                    Prediction

                  </th>



                  <th>

                    Human Probability

                  </th>



                  <th>

                    Bot Probability

                  </th>



                  <th>

                    Detection ID

                  </th>



                </tr>



              </thead>



              <tbody>



                {batchResult.results.map(

                  (item) => (



                    <tr

                      key={

                        item.detection_id

                      }

                    >



                      <td>

                        {item.row_number}

                      </td>



                      <td>



                        <span

                          className={`badge ${

                            item.prediction === 1

                              ? "bot"

                              : "human"

                          }`}

                        >

                          {item.label}

                        </span>



                      </td>



                      <td>

                        {(

                          Number(

                            item.human_probability

                          ) * 100

                        ).toFixed(1)}

                        %

                      </td>



                      <td>

                        {(

                          Number(

                            item.bot_probability

                          ) * 100

                        ).toFixed(1)}

                        %

                      </td>



                      <td className="detection-id-cell">

                        {item.detection_id}

                      </td>



                    </tr>



                  )

                )}



              </tbody>



            </table>



          </div>



        </section>



      )}



      {/* RAW LOG ANALYSIS */}



      <section className="panel upload-panel">



        <div className="panel-header">



          <h2>

            Raw Log Analysis

          </h2>



          <p>

            Upload Apache or Nginx-style access

            logs for automatic sessionization,

            feature extraction, ML classification

            and behavioral analysis.

          </p>



        </div>



        <div className="upload-area">



          <div className="upload-input-wrapper">



            <input

              id="raw-log-file"

              type="file"

              accept=".log,.txt"

              onChange={handleRawFileChange}

            />



            <label

              htmlFor="raw-log-file"

              className="file-label"

            >

              Choose Raw Log File

            </label>



            <span className="selected-file">

              {selectedRawFile

                ? selectedRawFile.name

                : "No file selected"}

            </span>



          </div>



          <button

            type="button"

            className="upload-button"

            onClick={uploadRawLog}

            disabled={

              uploadingRaw ||

              !selectedRawFile

            }

          >

            {uploadingRaw

              ? "Analyzing..."

              : "Upload & Analyze Raw Log"}

          </button>



        </div>



        <div className="upload-info">



          <span>

            Maximum file size: 10 MB

          </span>



          <span>

            Supported formats: .log, .txt

          </span>



        </div>



      </section>



      {rawLogResult && (



        <section className="panel batch-result-panel">



          <div className="panel-header">



            <h2>

              Raw Log Analysis Results

            </h2>



            <p>

              Each raw log was grouped into a

              session and analyzed by the existing

              Random Forest model.

            </p>



          </div>



          <div className="batch-summary">



            <div className="batch-card">



              <span>

                Total Sessions

              </span>



              <strong>

                {rawLogResult.total_sessions}

              </strong>



            </div>



            <div className="batch-card human-summary">



              <span>

                ML Human

              </span>



              <strong>

                {rawLogResult.human_count}

              </strong>



            </div>



            <div className="batch-card bot-summary">



              <span>

                ML Bot

              </span>



              <strong>

                {rawLogResult.bot_count}

              </strong>



            </div>



          </div>



          <div className="raw-session-list">



            {rawLogResult.sessions?.map(

              (session) => (



                <div

                  className="raw-session-card"

                  key={session.detection_id}

                >



                  <div className="raw-session-header">



                    <div>



                      <h3>

                        Session{" "}

                        {session.session_number}

                      </h3>



                      <p>

                        {session.ip}

                      </p>



                      <small>

                        {session.user_agent}

                      </small>



                    </div>



                    <div className="raw-session-status">



                      <span className="raw-label">

                        ML Classification

                      </span>



                      <strong

                        className={

                          session.prediction === 1

                            ? "result-bot"

                            : "result-human"

                        }

                      >

                        {session.label}

                      </strong>



                      <span>

                        Confidence:{" "}

                        {(

                          Math.max(

                            Number(

                              session.human_probability

                            ),

                            Number(

                              session.bot_probability

                            )

                          ) * 100

                        ).toFixed(2)}

                        %

                      </span>



                    </div>



                  </div>



                  <div className="raw-session-metrics">



                    <div>



                      <span>

                        Requests

                      </span>



                      <strong>

                        {session.requests}

                      </strong>



                    </div>



                    <div>



                      <span>

                        Behavioral Risk

                      </span>



                      <strong>

                        {session.explanation

                          ?.risk_level ||

                          "Unknown"}

                      </strong>



                    </div>



                    <div>



                      <span>

                        Request Rate

                      </span>



                      <strong>

                        {session.explanation

                          ?.request_rate ?? 0}

                      </strong>



                    </div>



                    <div>



                      <span>

                        Error Rate

                      </span>



                      <strong>

                          {(Number(session.explanation?.error_rate ?? 0)).toFixed(1)}%

                        </strong>



                    </div>



                  </div>



                  {session.explanation

                    ?.indicators?.length > 0 && (



                    <div className="explanation-box">



                      <h4>

                        Behavioral Indicators

                      </h4>



                      <ul>



                        {session.explanation.indicators.map(

                          (

                            indicator,

                            index

                          ) => (



                            <li key={index}>

                              {indicator}

                            </li>



                          )

                        )}



                      </ul>



                    </div>



                  )}



                  {session.explanation

                    ?.observations?.length > 0 && (



                    <div className="observation-box">



                      <h4>

                        Observations

                      </h4>



                      <ul>



                        {session.explanation.observations.map(

                          (

                            observation,

                            index

                          ) => (



                            <li key={index}>

                              {observation}

                            </li>



                          )

                        )}



                      </ul>



                    </div>



                  )}



                </div>



              )

            )}



          </div>



        </section>



      )}



      {/* ALERTS & INCIDENTS */}
      <section className="panel alerts-panel">
        <div className="panel-header">
          <div>
            <h2>Alerts & Incidents</h2>
            <p>
              Real-time alerts generated from high-risk
              behavioral activity.
            </p>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span>Total Alerts</span>
            <strong>{alertAnalytics?.total_alerts ?? 0}</strong>
          </div>
          <div className="stat-card">
            <span>Open</span>
            <strong>{alertAnalytics?.open_alerts ?? 0}</strong>
          </div>
          <div className="stat-card">
            <span>Investigating</span>
            <strong>{alertAnalytics?.investigating_alerts ?? 0}</strong>
          </div>
          <div className="stat-card">
            <span>Resolved</span>
            <strong>{alertAnalytics?.resolved_alerts ?? 0}</strong>
          </div>
        </div>

        <div className="sample-buttons" style={{ marginBottom: "20px" }}>
          {["ALL", "OPEN", "INVESTIGATING", "RESOLVED"].map((status) => (
            <button
              key={status}
              type="button"
              className={
                alertFilter === status
                  ? "sample-button active-human"
                  : "sample-button"
              }
              onClick={() => setAlertFilter(status)}
            >
              {status === "ALL" ? "All Alerts" : status}
            </button>
          ))}
        </div>

        {alertsLoading ? (
          <div className="empty-state">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="empty-state">
            No alerts found for the selected filter.
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {alerts.map((alert) => {
              const severity = String(
                alert.severity || "LOW"
              ).toUpperCase();

              const status = String(
                alert.status || "OPEN"
              ).toUpperCase();

              const severityStyle = {
                display: "inline-block",
                padding: "5px 10px",
                borderRadius: "999px",
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "0.4px",
                background:
                  severity === "CRITICAL"
                    ? "#fce8e6"
                    : severity === "HIGH"
                    ? "#fff0e6"
                    : severity === "MEDIUM"
                    ? "#fff8dc"
                    : "#eaf4ff",
                color:
                  severity === "CRITICAL"
                    ? "#b42318"
                    : severity === "HIGH"
                    ? "#c2410c"
                    : severity === "MEDIUM"
                    ? "#946200"
                    : "#245b8a",
              };

              const statusStyle = {
                display: "inline-block",
                padding: "5px 10px",
                borderRadius: "999px",
                fontSize: "11px",
                fontWeight: 800,
                background:
                  status === "RESOLVED"
                    ? "#e8f5e9"
                    : status === "INVESTIGATING"
                    ? "#fff8dc"
                    : "#fce8e6",
                color:
                  status === "RESOLVED"
                    ? "#18794e"
                    : status === "INVESTIGATING"
                    ? "#946200"
                    : "#b42318",
              };

              return (
                <div
                  key={alert.id}
                  style={{
                    border: "1px solid #e1e6eb",
                    borderRadius: "12px",
                    padding: "20px",
                    background: "#ffffff",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "20px",
                      marginBottom: "18px",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          marginBottom: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span style={severityStyle}>
                          {severity}
                        </span>

                        <strong style={{ fontSize: "16px" }}>
                          {alert.title}
                        </strong>
                      </div>

                      {alert.description && (
                        <p
                          style={{
                            margin: 0,
                            color: "#697586",
                            fontSize: "13px",
                            lineHeight: 1.6,
                          }}
                        >
                          {alert.description}
                        </p>
                      )}
                    </div>

                    <span style={statusStyle}>
                      {status}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(4, minmax(0, 1fr))",
                      gap: "12px",
                      marginBottom: "18px",
                    }}
                  >
                    <div
                      style={{
                        padding: "13px",
                        borderRadius: "8px",
                        background: "#f8fafc",
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          fontSize: "11px",
                          color: "#697586",
                          marginBottom: "5px",
                          fontWeight: 600,
                        }}
                      >
                        IP ADDRESS
                      </span>

                      <strong
                        style={{
                          fontSize: "13px",
                          wordBreak: "break-word",
                        }}
                      >
                        {alert.ip_address || "—"}
                      </strong>
                    </div>

                    <div
                      style={{
                        padding: "13px",
                        borderRadius: "8px",
                        background: "#f8fafc",
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          fontSize: "11px",
                          color: "#697586",
                          marginBottom: "5px",
                          fontWeight: 600,
                        }}
                      >
                        RISK SCORE
                      </span>

                      <strong style={{ fontSize: "18px" }}>
                        {Number(alert.risk_score ?? 0)}
                      </strong>
                    </div>

                    <div
                      style={{
                        padding: "13px",
                        borderRadius: "8px",
                        background: "#f8fafc",
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          fontSize: "11px",
                          color: "#697586",
                          marginBottom: "5px",
                          fontWeight: 600,
                        }}
                      >
                        BOT PROBABILITY
                      </span>

                      <strong style={{ fontSize: "18px" }}>
                        {(
                          Number(alert.bot_probability ?? 0) * 100
                        ).toFixed(1)}
                        %
                      </strong>
                    </div>

                    <div
                      style={{
                        padding: "13px",
                        borderRadius: "8px",
                        background: "#f8fafc",
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          fontSize: "11px",
                          color: "#697586",
                          marginBottom: "5px",
                          fontWeight: 600,
                        }}
                      >
                        CREATED
                      </span>

                      <strong style={{ fontSize: "13px" }}>
                        {alert.created_at
                          ? new Date(
                              alert.created_at
                            ).toLocaleString()
                          : "—"}
                      </strong>
                    </div>
                  </div>

                  {alert.user_agent && (
                    <div
                      style={{
                        padding: "12px 14px",
                        marginBottom: "16px",
                        borderRadius: "8px",
                        background: "#f8fafc",
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          fontSize: "11px",
                          color: "#697586",
                          marginBottom: "5px",
                          fontWeight: 600,
                        }}
                      >
                        USER AGENT
                      </span>

                      <span
                        style={{
                          fontSize: "12px",
                          color: "#374151",
                          wordBreak: "break-word",
                        }}
                      >
                        {alert.user_agent}
                      </span>
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      borderTop: "1px solid #edf0f2",
                      paddingTop: "15px",
                    }}
                  >
                    {status === "OPEN" && (
                      <button
                        type="button"
                        className="sample-button"
                        onClick={() =>
                          updateAlertStatus(
                            alert.id,
                            "INVESTIGATING"
                          )
                        }
                      >
                        Investigate
                      </button>
                    )}

                    {status === "INVESTIGATING" && (
                      <button
                        type="button"
                        className="sample-button"
                        onClick={() =>
                          updateAlertStatus(
                            alert.id,
                            "RESOLVED"
                          )
                        }
                      >
                        Resolve
                      </button>
                    )}

                    {status === "RESOLVED" && (
                      <button
                        type="button"
                        className="sample-button"
                        onClick={() =>
                          updateAlertStatus(
                            alert.id,
                            "OPEN"
                          )
                        }
                      >
                        Reopen
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* MODEL PERFORMANCE */}



      <section className="panel performance-panel">



        <div className="panel-header">



          <h2>

            Model Performance

          </h2>



          <p>

            Final Random Forest evaluation on

            the untouched test dataset.

          </p>



        </div>



        <div className="metric-grid">



          {modelMetrics.map(

            (metric) => (



              <div

                className="metric-card"

                key={metric.name}

              >



                <span>

                  {metric.name}

                </span>



                <strong>

                  {metric.value.toFixed(2)}%

                </strong>



                <div className="metric-bar">



                  <div

                    className="metric-bar-fill"

                    style={{

                      width: `${metric.value}%`,

                    }}

                  />



                </div>



              </div>



            )

          )}



        </div>



        <div className="performance-grid">



          <div className="sub-panel">



            <h3>

              Confusion Matrix

            </h3>



            <p className="sub-panel-description">

              Final test-set predictions.

            </p>



            <div className="confusion-wrapper">



              <div className="axis-label top-label">

                Predicted

              </div>



              <div className="matrix-layout">



                <div className="axis-label side-label">

                  Actual

                </div>



                <div>



                  <div className="matrix-columns">



                    <span>

                      Human

                    </span>



                    <span>

                      Bot

                    </span>



                  </div>



                  <div className="confusion-matrix">



                    <div className="matrix-cell true-human">



                      <span>

                        7,940

                      </span>



                      <small>

                        True Human

                      </small>



                    </div>



                    <div className="matrix-cell false-bot">



                      <span>

                        139

                      </span>



                      <small>

                        False Bot

                      </small>



                    </div>



                    <div className="matrix-cell false-human">



                      <span>

                        59

                      </span>



                      <small>

                        False Human

                      </small>



                    </div>



                    <div className="matrix-cell true-bot">



                      <span>

                        1,965

                      </span>



                      <small>

                        True Bot

                      </small>



                    </div>



                  </div>



                  <div className="matrix-rows">



                    <span>

                      Human

                    </span>



                    <span>

                      Bot

                    </span>



                  </div>



                </div>



              </div>



            </div>



          </div>



          <div className="sub-panel">



            <h3>

              Top Feature Importance

            </h3>



            <p className="sub-panel-description">

              Most influential features used by

              the Random Forest classifier.

            </p>



            <div className="feature-chart">



              <ResponsiveContainer

                width="100%"

                height={380}

              >



                <BarChart

                  data={featureImportance}

                  layout="vertical"

                  margin={{

                    top: 5,

                    right: 20,

                    left: 20,

                    bottom: 5,

                  }}

                >



                  <CartesianGrid

                    strokeDasharray="3 3"

                  />



                  <XAxis

                    type="number"

                    domain={[0, 35]}

                    unit="%"

                  />



                  <YAxis

                    type="category"

                    dataKey="name"

                    width={110}

                  />



                  <Tooltip

                    formatter={(value) => [

                      `${Number(value).toFixed(2)}%`,

                      "Importance",

                    ]}

                  />



                  <Bar

                    dataKey="value"

                    fill="#315f8c"

                    radius={[0, 5, 5, 0]}

                  />



                </BarChart>



              </ResponsiveContainer>



            </div>



          </div>



        </div>



      </section>



      {/* SINGLE SESSION ANALYSIS */}



      <section className="panel analysis-panel">



        <div className="panel-header">



          <h2>

            Analyze Web Session

          </h2>



          <p>

            Enter session-level log features

            and run the Random Forest classifier.

          </p>



        </div>



        <div className="sample-buttons">



          <button

            type="button"

            className={

              selectedSample === "Human"

                ? "sample-button active-human"

                : "sample-button"

            }

            onClick={() =>

              loadSample(

                humanSample,

                "Human"

              )

            }

          >

            Load Human Sample

          </button>



          <button

            type="button"

            className={

              selectedSample === "Bot"

                ? "sample-button active-bot"

                : "sample-button"

            }

            onClick={() =>

              loadSample(

                botSample,

                "Bot"

              )

            }

          >

            Load Bot Sample

          </button>



        </div>



        <div className="sample-status">



          Current sample:{" "}



          <strong>

            {selectedSample}

          </strong>



        </div>



        <form

          onSubmit={analyzeSession}

          className="analysis-form"

        >



          <div className="form-grid">



            {Object.entries(form).map(

              ([key, value]) => (



                <label

                  key={key}

                  className="field"

                >



                  <span>

                    {key.replaceAll(

                      "\_",

                      " "

                    )}

                  </span>



                  <input

                    type="number"

                    step="any"

                    name={key}

                    value={value}

                    onChange={handleChange}

                  />



                </label>



              )

            )}



          </div>



          <button

            type="submit"

            className="analyze-button"

            disabled={analyzing}

          >

            {analyzing

              ? "Analyzing..."

              : "Analyze Session"}

          </button>



        </form>



      </section>



      {/* LATEST RESULT */}



      {result && (



        <section className="result-card">



          <div>



            <p className="eyebrow">

              LATEST PREDICTION

            </p>



            <h2

              className={

                result.prediction === 1

                  ? "result-bot"

                  : "result-human"

              }

            >

              {result.label}

            </h2>



            <p className="result-id">

              Detection ID:{" "}

              {result.detection_id}

            </p>



          </div>



          <div className="probabilities">



            <div>



              <span>

                Human

              </span>



              <strong>

                {(

                  Number(

                    result.human_probability

                  ) * 100

                ).toFixed(1)}

                %

              </strong>



            </div>



            <div>



              <span>

                Bot

              </span>



              <strong>

                {(

                  Number(

                    result.bot_probability

                  ) * 100

                ).toFixed(1)}

                %

              </strong>



            </div>



          </div>



        </section>



      )}



      {/* HISTORY */}



      <section className="panel">



        <div className="panel-header">



          <h2>

            Recent Detection History

          </h2>



          <p>

            Latest sessions analyzed by the

            Random Forest model.

          </p>



        </div>



        {loading ? (



          <div className="empty-state">

            Loading detection history...

          </div>



        ) : history.length === 0 ? (



          <div className="empty-state">

            No detections available yet.

          </div>



        ) : (



          <div className="table-wrapper">



            <table>



              <thead>



                <tr>



                  <th>

                    Result

                  </th>



                  <th>

                    Human Probability

                  </th>



                  <th>

                    Bot Probability

                  </th>



                  <th>

                    Requests

                  </th>



                  <th>

                    Average Time

                  </th>



                  <th>

                    Detected At

                  </th>



                </tr>



              </thead>



              <tbody>



                {history.map(

                  (item) => (



                    <tr

                      key={item.id}

                    >



                      <td>



                        <span

                          className={`badge ${

                            item.prediction === 1

                              ? "bot"

                              : "human"

                          }`}

                        >

                          {item.label}

                        </span>



                      </td>



                      <td>

                        {(

                          Number(

                            item.human_probability

                          ) * 100

                        ).toFixed(1)}

                        %

                      </td>



                      <td>

                        {(

                          Number(

                            item.bot_probability

                          ) * 100

                        ).toFixed(1)}

                        %

                      </td>



                      <td>

                        {

                          item.number_of_requests

                        }

                      </td>



                      <td>

                        {item.average_time}

                      </td>



                      <td>

                        {new Date(

                          item.created_at

                        ).toLocaleString()}

                      </td>



                    </tr>



                  )

                )}



              </tbody>



            </table>



          </div>



        )}



      </section>



    </main>

  );

}



ReactDOM.createRoot(

  document.getElementById("root")

).render(

  <React.StrictMode>

    <App />

  </React.StrictMode>

);