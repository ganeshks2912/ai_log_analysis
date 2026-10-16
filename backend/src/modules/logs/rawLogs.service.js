import fs from "fs";
import readline from "readline";
import { predictBot } from "../detection/detection.service.js";
import { saveDetection } from "../detection/detection.repository.js";
import { generateDetectionExplanation } from "../detection/explanation.service.js";
import { createHighRiskAlert } from "../alerts/alerts.service.js";

const MODEL_FEATURES = [
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
];

/*
 * Raw-log session configuration.
 *
 * If the same IP + User-Agent has no activity for more than
 * 30 minutes, a new session is created.
 */
const SESSION_TIMEOUT_SECONDS = 30 * 60;

const IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
  ".ico",
  ".bmp",
];

const HTML_EXTENSIONS = [
  ".html",
  ".htm",
  ".php",
  ".asp",
  ".aspx",
  ".jsp",
];

const CSS_EXTENSIONS = [".css"];

const JS_EXTENSIONS = [".js"];

/*
 * User-Agent patterns commonly associated with automation.
 *
 * This is used ONLY by the behavioral analysis layer.
 * It does NOT override the Random Forest prediction.
 */
const AUTOMATED_USER_AGENT_PATTERNS = [
  /python-requests/i,
  /python-urllib/i,
  /curl/i,
  /wget/i,
  /httpclient/i,
  /okhttp/i,
  /scrapy/i,
  /aiohttp/i,
  /axios/i,
  /postmanruntime/i,
  /go-http-client/i,
  /java\/\d/i,
  /libwww-perl/i,
  /mechanize/i,
  /selenium/i,
  /headlesschrome/i,
  /phantomjs/i,
  /puppeteer/i,
  /playwright/i,
  /bot/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
];

/* ---------------------------------------------------------
 * Apache / Nginx combined log parsing
 * --------------------------------------------------------- */

const parseApacheTimestamp = (value) => {
  /*
   * Example:
   * 01/Oct/2026:10:15:32 +0530
   */

  const match = value.match(
    /^(\d{2})\/([A-Za-z]{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2})\s*([+-])(\d{2})(\d{2})?$/
  );

  if (!match) {
    return null;
  }

  const [
    ,
    day,
    monthText,
    year,
    hour,
    minute,
    second,
    sign,
    offsetHour,
    offsetMinute = "00",
  ] = match;

  const months = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };

  const month = months[monthText];

  if (month === undefined) {
    return null;
  }

  const utcTime = Date.UTC(
    Number(year),
    month,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  );

  const offsetMinutes =
    Number(offsetHour) * 60 +
    Number(offsetMinute);

  const signedOffset =
    sign === "+"
      ? offsetMinutes
      : -offsetMinutes;

  return new Date(
    utcTime - signedOffset * 60 * 1000
  );
};

const parseApacheLine = (line) => {
  /*
   * Apache Combined Log Format:
   *
   * 192.168.1.10 - - [01/Oct/2026:10:15:32 +0530]
   * "GET /index.html HTTP/1.1" 200 4210
   * "https://example.com/" "Mozilla/5.0"
   */

  const regex =
    /^(\S+)\s+\S+\s+\S+\s+\[([^\]]+)\]\s+"(\S+)\s+(.+?)\s+HTTP\/[\d.]+"\s+(\d{3})\s+(\S+)(?:\s+"([^"]*)"\s+"([^"]*)")?/;

  const match = line.match(regex);

  if (!match) {
    return null;
  }

  const [
    ,
    ip,
    rawTimestamp,
    method,
    url,
    status,
    bytes,
    referrer,
    userAgent,
  ] = match;

  const timestamp =
    parseApacheTimestamp(rawTimestamp);

  if (!timestamp) {
    return null;
  }

  return {
    ip,
    timestamp,
    method: method.toUpperCase(),
    url,
    status: Number(status),
    bytes:
      bytes === "-"
        ? 0
        : Number(bytes) || 0,
    referrer:
      !referrer || referrer === "-"
        ? null
        : referrer,
    userAgent:
      !userAgent || userAgent === "-"
        ? "UNKNOWN"
        : userAgent,
  };
};

/* ---------------------------------------------------------
 * Feature utilities
 * --------------------------------------------------------- */

const getFileExtension = (url) => {
  try {
    const cleanUrl = url
      .split("?")[0]
      .split("#")[0];

    const lastDot =
      cleanUrl.lastIndexOf(".");

    if (lastDot === -1) {
      return "";
    }

    return cleanUrl
      .substring(lastDot)
      .toLowerCase();
  } catch {
    return "";
  }
};

const getPathDepth = (url) => {
  try {
    const cleanUrl = url
      .split("?")[0]
      .split("#")[0]
      .replace(/^https?:\/\/[^/]+/i, "");

    const parts = cleanUrl
      .split("/")
      .filter(Boolean);

    return parts.length;
  } catch {
    return 0;
  }
};

const standardDeviation = (values) => {
  if (values.length <= 1) {
    return 0;
  }

  const mean =
    values.reduce(
      (sum, value) => sum + value,
      0
    ) / values.length;

  const variance =
    values.reduce(
      (sum, value) =>
        sum +
        Math.pow(value - mean, 2),
      0
    ) / values.length;

  return Math.sqrt(variance);
};

const isAutomatedUserAgent = (userAgent) => {
  return AUTOMATED_USER_AGENT_PATTERNS.some(
    (pattern) =>
      pattern.test(userAgent)
  );
};

/* ---------------------------------------------------------
 * Session feature extraction
 * --------------------------------------------------------- */

const calculateSessionFeatures = (
  session
) => {
  const requests = [...session.requests].sort(
    (a, b) =>
      a.timestamp.getTime() -
      b.timestamp.getTime()
  );

  const requestCount =
    requests.length;

  if (requestCount === 0) {
    throw new Error(
      "Cannot calculate features for empty session."
    );
  }

  const timestamps = requests.map(
    (request) =>
      request.timestamp.getTime()
  );

  const firstTimestamp =
    timestamps[0];

  const lastTimestamp =
    timestamps[timestamps.length - 1];

  const totalDuration =
    requestCount > 1
      ? (lastTimestamp -
          firstTimestamp) /
        1000
      : 0;

  const intervals = [];

  for (
    let index = 1;
    index < timestamps.length;
    index += 1
  ) {
    intervals.push(
      (timestamps[index] -
        timestamps[index - 1]) /
        1000
    );
  }

  const averageTime =
    intervals.length > 0
      ? intervals.reduce(
          (sum, value) =>
            sum + value,
          0
        ) / intervals.length
      : 0;

  const intervalStdDev =
    standardDeviation(intervals);

  /* -------------------------------
   * Request repetition
   * ------------------------------- */

  const urlCounts = new Map();

  for (const request of requests) {
    const key = request.url;

    urlCounts.set(
      key,
      (urlCounts.get(key) || 0) + 1
    );
  }

  let repeatedRequests = 0;

  for (const count of urlCounts.values()) {
    if (count > 1) {
      repeatedRequests +=
        count - 1;
    }
  }

  const repeatedRatio =
    requestCount > 0
      ? repeatedRequests /
        requestCount
      : 0;

  /* -------------------------------
   * HTTP responses
   * ------------------------------- */

  let response2xx = 0;
  let response3xx = 0;
  let response4xx = 0;
  let response5xx = 0;

  /* -------------------------------
   * HTTP methods
   * ------------------------------- */

  let getMethod = 0;
  let postMethod = 0;
  let headMethod = 0;
  let otherMethod = 0;

  /* -------------------------------
   * Other features
   * ------------------------------- */

  let nightRequests = 0;
  let unassignedRequests = 0;

  let images = 0;
  let totalHtml = 0;
  let totalCss = 0;
  let totalJs = 0;

  let totalBytes = 0;

  const depths = [];

  const referrers = new Set();
  const fileTypes = new Set();

  const secondBuckets = new Map();

  let errorRequests = 0;

  /* -------------------------------
   * Process requests
   * ------------------------------- */

  for (const request of requests) {
    const {
      status,
      method,
      timestamp,
      bytes,
      referrer,
      url,
    } = request;

    totalBytes += bytes;

    /* HTTP status */

    if (
      status >= 200 &&
      status < 300
    ) {
      response2xx += 1;
    } else if (
      status >= 300 &&
      status < 400
    ) {
      response3xx += 1;
    } else if (
      status >= 400 &&
      status < 500
    ) {
      response4xx += 1;
      errorRequests += 1;
    } else if (status >= 500) {
      response5xx += 1;
      errorRequests += 1;
    }

    /* HTTP method */

    if (method === "GET") {
      getMethod += 1;
    } else if (method === "POST") {
      postMethod += 1;
    } else if (method === "HEAD") {
      headMethod += 1;
    } else {
      otherMethod += 1;
    }

    /* Night activity */

    const hour =
      timestamp.getUTCHours();

    if (
      hour < 6 ||
      hour >= 22
    ) {
      nightRequests += 1;
    }

    /* Referrer */

    if (!referrer) {
      unassignedRequests += 1;
    } else {
      referrers.add(referrer);
    }

    /* File type */

    const extension =
      getFileExtension(url);

    if (
      IMAGE_EXTENSIONS.includes(
        extension
      )
    ) {
      images += 1;
    }

    if (
      HTML_EXTENSIONS.includes(
        extension
      )
    ) {
      totalHtml += 1;
    }

    if (
      CSS_EXTENSIONS.includes(
        extension
      )
    ) {
      totalCss += 1;
    }

    if (
      JS_EXTENSIONS.includes(
        extension
      )
    ) {
      totalJs += 1;
    }

    if (extension) {
      fileTypes.add(extension);
    }

    /* URL depth */

    depths.push(
      getPathDepth(url)
    );

    /* Requests per second */

    const second =
      Math.floor(
        timestamp.getTime() / 1000
      );

    secondBuckets.set(
      second,
      (secondBuckets.get(second) || 0) +
        1
    );
  }

  /* -------------------------------
   * Ratios
   * ------------------------------- */

  const htmlToImage =
    images > 0
      ? totalHtml / images
      : totalHtml;

  const htmlToCss =
    totalCss > 0
      ? totalHtml / totalCss
      : totalHtml;

  const htmlToJs =
    totalJs > 0
      ? totalHtml / totalJs
      : totalHtml;

  /*
   * IMPORTANT:
   *
   * Some Zenodo features require information
   * that is not directly available in Apache/Nginx
   * access logs.
   *
   * These are therefore operational proxies.
   */

  const width =
    depths.length > 0
      ? Math.max(...depths)
      : 0;

  const depth =
    depths.length > 0
      ? depths.reduce(
          (sum, value) =>
            sum + value,
          0
        ) / depths.length
      : 0;

  const stdDepth =
    standardDeviation(depths);

  const consecutive =
    intervals.length > 0
      ? intervals.filter(
          (interval) =>
            interval <= 1
        ).length
      : 0;

  const ppi =
    requestCount > 0
      ? requestCount /
        Math.max(
          totalDuration,
          1
        )
      : 0;

  const sfReferrer =
    requestCount > 0
      ? referrers.size /
        requestCount
      : 0;

  const sfFiletype =
    requestCount > 0
      ? fileTypes.size /
        requestCount
      : 0;

  const maxBarrage =
    secondBuckets.size > 0
      ? Math.max(
          ...secondBuckets.values()
        )
      : 0;

  const nightRatio =
    requestCount > 0
      ? nightRequests /
        requestCount
      : 0;

  const unassignedRatio =
    requestCount > 0
      ? unassignedRequests /
        requestCount
      : 0;

  const rapidRatio =
    requestCount > 0
      ? consecutive /
        requestCount
      : 0;

  const errorRatio =
    requestCount > 0
      ? errorRequests /
        requestCount
      : 0;

  /*
   * Behavioral penalty.
   *
   * This is NOT used to change the Random Forest
   * prediction. It belongs to the behavioral-analysis layer.
   */

  const penalty =
    rapidRatio * 0.4 +
    repeatedRatio * 0.3 +
    errorRatio * 0.3;

  return {
    NUMBER_OF_REQUESTS:
      requestCount,

    TOTAL_DURATION:
      totalDuration,

    AVERAGE_TIME:
      averageTime,

    STANDARD_DEVIATION:
      intervalStdDev,

    REPEATED_REQUESTS:
      repeatedRatio,

    HTTP_RESPONSE_2XX:
      response2xx,

    HTTP_RESPONSE_3XX:
      response3xx,

    HTTP_RESPONSE_4XX:
      response4xx,

    HTTP_RESPONSE_5XX:
      response5xx,

    GET_METHOD:
      getMethod,

    POST_METHOD:
      postMethod,

    HEAD_METHOD:
      headMethod,

    OTHER_METHOD:
      otherMethod,

    NIGHT:
      nightRatio,

    UNASSIGNED:
      unassignedRatio,

    IMAGES:
      images,

    TOTAL_HTML:
      totalHtml,

    HTML_TO_IMAGE:
      htmlToImage,

    HTML_TO_CSS:
      htmlToCss,

    HTML_TO_JS:
      htmlToJs,

    WIDTH:
      width,

    DEPTH:
      depth,

    STD_DEPTH:
      stdDepth,

    CONSECUTIVE:
      consecutive,

    DATA:
      totalBytes,

    PPI:
      ppi,

    SF_REFERRER:
      sfReferrer,

    SF_FILETYPE:
      sfFiletype,

    MAX_BARRAGE:
      maxBarrage,

    PENALTY:
      penalty,
  };
};

/* ---------------------------------------------------------
 * Behavioral analysis
 * --------------------------------------------------------- */

const analyzeBehavior = (
  session,
  features
) => {
  const indicators = [];

  const requestCount =
    features.NUMBER_OF_REQUESTS;

  const totalDuration =
    features.TOTAL_DURATION;

  const requestRate =
    requestCount /
    Math.max(totalDuration, 1);

  const errorCount =
    features.HTTP_RESPONSE_4XX +
    features.HTTP_RESPONSE_5XX;

  const errorRate =
    requestCount > 0
      ? errorCount /
        requestCount
      : 0;

  const repeatedRatio =
    features.REPEATED_REQUESTS;

  const consecutiveRatio =
    requestCount > 0
      ? features.CONSECUTIVE /
        requestCount
      : 0;

  const automatedUA =
    isAutomatedUserAgent(
      session.userAgent
    );

  /* Automated User-Agent */

  if (automatedUA) {
    indicators.push(
      "Automated User-Agent detected"
    );
  }

  /* High request rate */

  if (requestRate >= 2) {
    indicators.push(
      "High request rate"
    );
  }

  /* Very rapid requests */

  if (consecutiveRatio >= 0.5) {
    indicators.push(
      "Very rapid consecutive requests"
    );
  }

  /* Repeated requests */

  if (repeatedRatio >= 0.2) {
    indicators.push(
      "High repeated-request behavior"
    );
  }

  /* Consecutive activity */

  if (consecutiveRatio >= 0.5) {
    indicators.push(
      "Large proportion of consecutive requests"
    );
  }

  /* Missing referrers */

  if (features.UNASSIGNED >= 0.5) {
    indicators.push(
      "Most requests have no referrer"
    );
  }

  /* HTTP errors */

  if (errorRate >= 0.3) {
    indicators.push(
      "High HTTP error activity"
    );
  }

  /* Night activity */

  if (features.NIGHT >= 0.5) {
    indicators.push(
      "Most requests occurred during night hours"
    );
  }

  /*
   * Risk score.
   *
   * This is deliberately separate from ML prediction.
   */

  let riskScore = 0;

  if (automatedUA) {
    riskScore += 4;
  }

  if (requestRate >= 2) {
    riskScore += 2;
  }

  if (consecutiveRatio >= 0.5) {
    riskScore += 2;
  }

  if (repeatedRatio >= 0.2) {
    riskScore += 1;
  }

  if (errorRate >= 0.3) {
    riskScore += 2;
  }

  if (features.UNASSIGNED >= 0.5) {
    riskScore += 1;
  }

  if (features.NIGHT >= 0.5) {
    riskScore += 1;
  }

  let riskLevel = "Low";

  if (riskScore >= 7) {
    riskLevel = "High";
  } else if (riskScore >= 3) {
    riskLevel = "Medium";
  }

  /*
   * Combined assessment.
   *
   * IMPORTANT:
   * The ML prediction is never overwritten.
   */

  let overallAssessment =
    "Normal Activity";

  if (
    riskLevel === "High"
  ) {
    overallAssessment =
      "Suspicious Activity";
  } else if (
    riskLevel === "Medium"
  ) {
    overallAssessment =
      "Potentially Automated Activity";
  }

  return {
    risk_level: riskLevel,

    risk_score: riskScore,

    overall_assessment:
      overallAssessment,

    automated_user_agent:
      automatedUA,

    request_rate:
      Number(requestRate.toFixed(4)),

    error_rate:
      Number(
        (errorRate * 100).toFixed(1)
      ),

    indicators,
  };
};

/* ---------------------------------------------------------
 * Raw log parsing + sessionization
 * --------------------------------------------------------- */

const parseRawLogFile = async (
  filePath
) => {
  /*
   * Map:
   *
   * IP + User-Agent
   *
   * to the most recent active session.
   */

  const activeSessions =
    new Map();

  const completedSessions = [];

  const fileStream =
    fs.createReadStream(filePath);

  const lineReader =
    readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

  let totalLines = 0;
  let parsedLines = 0;
  let skippedLines = 0;

  for await (
    const line of lineReader
  ) {
    totalLines += 1;

    if (!line.trim()) {
      continue;
    }

    const parsed =
      parseApacheLine(line);

    if (!parsed) {
      skippedLines += 1;
      continue;
    }

    parsedLines += 1;

    const sessionKey =
      `${parsed.ip}|${parsed.userAgent}`;

    const existing =
      activeSessions.get(
        sessionKey
      );

    /*
     * If this is the first request for
     * this IP + User-Agent, create a session.
     */

    if (!existing) {
      activeSessions.set(
        sessionKey,
        {
          ip: parsed.ip,
          userAgent:
            parsed.userAgent,
          requests: [parsed],
          lastTimestamp:
            parsed.timestamp,
        }
      );

      continue;
    }

    const gapSeconds =
      (
        parsed.timestamp.getTime() -
        existing.lastTimestamp.getTime()
      ) / 1000;

    /*
     * Start a new session after 30 minutes
     * of inactivity.
     */

    if (
      gapSeconds >
      SESSION_TIMEOUT_SECONDS
    ) {
      completedSessions.push({
        ip: existing.ip,
        userAgent:
          existing.userAgent,
        requests:
          existing.requests,
      });

      activeSessions.set(
        sessionKey,
        {
          ip: parsed.ip,
          userAgent:
            parsed.userAgent,
          requests: [parsed],
          lastTimestamp:
            parsed.timestamp,
        }
      );
    } else {
      existing.requests.push(
        parsed
      );

      existing.lastTimestamp =
        parsed.timestamp;
    }
  }

  /*
   * Move remaining active sessions
   * to completed sessions.
   */

  for (const session of activeSessions.values()) {
    completedSessions.push({
      ip: session.ip,
      userAgent:
        session.userAgent,
      requests:
        session.requests,
    });
  }

  /*
   * Sort sessions by first request.
   */

  completedSessions.sort(
    (a, b) =>
      a.requests[0].timestamp.getTime() -
      b.requests[0].timestamp.getTime()
  );

  return {
    sessions: completedSessions,
    totalLines,
    parsedLines,
    skippedLines,
  };
};

/* ---------------------------------------------------------
 * Main raw-log processing
 * --------------------------------------------------------- */

export const processRawLogFile =
  async (filePath) => {
    const parsed =
      await parseRawLogFile(
        filePath
      );

    if (
      parsed.parsedLines === 0
    ) {
      throw new Error(
        "No valid Apache/Nginx access-log entries were found."
      );
    }

    const results = [];

    let humanCount = 0;
    let botCount = 0;

    for (
      let index = 0;
      index < parsed.sessions.length;
      index += 1
    ) {
      const session =
        parsed.sessions[index];

      /*
       * Generate model features.
       */

      const features =
        calculateSessionFeatures(
          session
        );

      /*
       * Send the feature vector to the
       * existing Random Forest through FastAPI.
       */

      const prediction =
        await predictBot(
          features
        );

      /*
       * Store the ML result.
       */

      const savedDetection =
        await saveDetection({
          prediction:
            prediction.prediction,

          label:
            prediction.label,

          human_probability:
            prediction.human_probability,

          bot_probability:
            prediction.bot_probability,

          number_of_requests:
            features.NUMBER_OF_REQUESTS,

          total_duration:
            features.TOTAL_DURATION,

          average_time:
            features.AVERAGE_TIME,

          repeated_requests:
            features.REPEATED_REQUESTS,
        });

      /*
       * Maintain ML counts.
       *
       * These counts represent ONLY the
       * Random Forest classification.
       */

      if (
        prediction.prediction === 1
      ) {
        botCount += 1;
      } else {
        humanCount += 1;
      }

      /*
       * Behavioral analysis is independent
       * of the ML prediction.
       */

      const behavioralAnalysis =
        analyzeBehavior(
          session,
          features
        );

      /*
       * Existing explanation engine.
       */

      const baseExplanation =
        generateDetectionExplanation(
          features,
          session.userAgent
        );

      /*
       * Merge the two explanation layers.
       */

      const explanation = {
        ...baseExplanation,

        risk_level:
          behavioralAnalysis.risk_level,

        risk_score:
          behavioralAnalysis.risk_score,

        overall_assessment:
          behavioralAnalysis.overall_assessment,

        automated_user_agent:
          behavioralAnalysis.automated_user_agent,

        request_rate:
          behavioralAnalysis.request_rate,

        error_rate:
          behavioralAnalysis.error_rate,

        indicators:
          behavioralAnalysis.indicators,

        observations:
          baseExplanation.observations || [],
      };

      let alert = null;

     
if (
  behavioralAnalysis.risk_level ===
  "High"
) {
  alert =
    await createHighRiskAlert({
      detectionId:
        savedDetection.id,

      session,

      prediction,

      explanation,
    });
}

      /*
       * Add a clear observation when
       * ML and behavioral analysis disagree.
       */

      const mlBot =
        prediction.prediction === 1;

      const behavioralSuspicious =
        behavioralAnalysis.risk_level ===
          "High" ||
        behavioralAnalysis.risk_level ===
          "Medium";

      if (
        mlBot !==
        behavioralSuspicious
      ) {
        explanation.observations.push(
          `ML classification and behavioral analysis differ: ML classified this session as ${prediction.label}, while behavioral analysis rated it ${behavioralAnalysis.risk_level} risk.`
        );
      }

      /*
       * Return the complete session result.
       */

      results.push({
        session_number:
          index + 1,

        ip:
          session.ip,

        user_agent:
          session.userAgent,

        requests:
          session.requests.length,

        prediction:
          prediction.prediction,

        label:
          prediction.label,

        human_probability:
          prediction.human_probability,

        bot_probability:
          prediction.bot_probability,

        detection_id:
          savedDetection.id,

        explanation,

        /*
         * Keep the generated feature vector
         * available for debugging and transparency.
         */

        features,
      });
    }

    return {
      total_lines:
        parsed.totalLines,

      parsed_lines:
        parsed.parsedLines,

      skipped_lines:
        parsed.skippedLines,

      total_sessions:
        parsed.sessions.length,

      /*
       * These are ML counts only.
       */

      human_count:
        humanCount,

      bot_count:
        botCount,

      results,
    };
  };

export {
  MODEL_FEATURES,
};