const getPercentage = (value, total) => {
  if (!total || total <= 0) {
    return 0;
  }

  return (value / total) * 100;
};

export const generateDetectionExplanation = (
  features,
  userAgent = ""
) => {
  const indicators = [];
  const observations = [];

  const requestCount =
    Number(features.NUMBER_OF_REQUESTS) || 0;

  const totalDuration =
    Number(features.TOTAL_DURATION) || 0;

  const averageTime =
    Number(features.AVERAGE_TIME) || 0;

  const repeatedRequests =
    Number(features.REPEATED_REQUESTS) || 0;

  const consecutive =
    Number(features.CONSECUTIVE) || 0;

  const maxBarrage =
    Number(features.MAX_BARRAGE) || 0;

  const unassigned =
    Number(features.UNASSIGNED) || 0;

  const response4xx =
    Number(features.HTTP_RESPONSE_4XX) || 0;

  const response5xx =
    Number(features.HTTP_RESPONSE_5XX) || 0;

  const night =
    Number(features.NIGHT) || 0;

  const ppi =
    Number(features.PPI) || 0;

  const userAgentLower =
    String(userAgent).toLowerCase();

  /*
   * Request-rate behavior
   */
  const requestRate =
    totalDuration > 0
      ? requestCount / totalDuration
      : requestCount;

  if (requestRate >= 2) {
    indicators.push(
      "High request rate"
    );
  } else if (requestRate >= 1) {
    observations.push(
      "Moderate request rate"
    );
  }

  /*
   * Very short request intervals
   */
  if (
    averageTime > 0 &&
    averageTime < 1
  ) {
    indicators.push(
      "Very rapid consecutive requests"
    );
  }

  /*
   * Repeated URLs
   */
  const repeatedRatio =
    repeatedRequests > 1
      ? repeatedRequests
      : repeatedRequests * 100;

  if (repeatedRatio >= 20) {
    indicators.push(
      "High repeated-request behavior"
    );
  }

  /*
   * Consecutive requests
   */
  const consecutivePercentage =
    getPercentage(
      consecutive,
      requestCount
    );

  if (consecutivePercentage >= 70) {
    indicators.push(
      "Large proportion of consecutive requests"
    );
  }

  /*
   * Burst traffic
   */
  if (maxBarrage >= 5) {
    indicators.push(
      "High request burst detected"
    );
  }

  /*
   * Missing referrer
   */
  if (unassigned >= 0.8) {
    indicators.push(
      "Most requests have no referrer"
    );
  }

  /*
   * HTTP errors
   */
  const errorCount =
    response4xx + response5xx;

  const errorPercentage =
    getPercentage(
      errorCount,
      requestCount
    );

  if (errorPercentage >= 30) {
    indicators.push(
      "High HTTP error activity"
    );
  }

  /*
   * Night activity
   */
  if (night >= 0.8) {
    observations.push(
      "Most activity occurred during night hours"
    );
  }

  /*
   * High requests per interval
   */
  if (ppi >= 20) {
    indicators.push(
      "Very high requests-per-interval activity"
    );
  }

  /*
   * User-Agent analysis
   */
  const botKeywords = [
    "bot",
    "crawler",
    "spider",
    "scrapy",
    "python-requests",
    "curl",
    "wget",
    "httpclient",
    "go-http-client",
  ];

  const detectedKeyword =
    botKeywords.find(
      (keyword) =>
        userAgentLower.includes(keyword)
    );

  if (detectedKeyword) {
    indicators.push(
      `Automated User-Agent detected (${detectedKeyword})`
    );
  }

  /*
   * Human-like observations
   */
  if (
    requestRate < 1 &&
    averageTime >= 2 &&
    repeatedRequests < 0.1
  ) {
    observations.push(
      "Browsing pattern appears relatively human-like"
    );
  }

  if (unassigned < 0.5) {
    observations.push(
      "Requests contain referrer information"
    );
  }

  if (maxBarrage <= 2) {
    observations.push(
      "No significant request burst detected"
    );
  }

  let riskLevel = "Low";

  if (indicators.length >= 4) {
    riskLevel = "High";
  } else if (indicators.length >= 2) {
    riskLevel = "Medium";
  }

  return {
    risk_level: riskLevel,
    indicators,
    observations,
    request_rate: Number(
      requestRate.toFixed(4)
    ),
    error_rate: Number(
      (errorPercentage / 100).toFixed(4)
    ),
  };
};
