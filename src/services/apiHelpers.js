const { retryAsync } = require("../utils/requestHandler");
const { config } = require("../config/index");
const axiosInstance = require("../utils/axiosInstance");
const { saveResponseToFile } = require("../utils/debugLog");
const apiDebug = config.apiDebug;

/**
 * Makes a POST request to the Noon API with retry logic.
 * @param {object} axiosInstance - The axios instance to use.
 * @param {string} url - The full Noon API endpoint URL.
 * @param {object} payload - The POST body.
 * @param {object} options - Additional axios options (e.g., { cookieString, headers }).
 * @param {function} [isSuccess] - Optional function to determine if response is successful.
 * @param {number} [retries=3] - Number of retries.
 * @param {number} [delay=2000] - Delay between retries in ms.
 * @returns {Promise<object>} The axios response.
 */
async function postWithRetry(
  url,
  payload,
  options,
  isSuccess = (resp) => resp && resp.status >= 200 && resp.status < 300,
  retries = 2,
  delay = 2000,
  logPrefix = "[RETRY]",
  logger
) {
  return retryAsync(
    () => axiosInstance.post(url, payload, options),
    retries,
    delay,
    isSuccess,
    logPrefix,
    logger
  );
}

/**
 * Makes a GET request to the Noon API with retry logic.
 * @param {object} axiosInstance - The axios instance to use.
 * @param {string} url - The full Noon API endpoint URL.
 * @param {object} options - Additional axios options (e.g., { cookieString, headers }).
 * @param {function} [isSuccess] - Optional function to determine if response is successful.
 * @param {number} [retries=3] - Number of retries.
 * @param {number} [delay=2000] - Delay between retries in ms.
 * @returns {Promise<object>} The axios response.
 */
async function getWithRetry(
  url,
  options,
  isSuccess = (resp) => resp && resp.status >= 200 && resp.status < 300,
  retries = 2,
  delay = 2000,
  logPrefix = "[RETRY]",
  logger
) {
  return retryAsync(
    () => axiosInstance.get(url, options),
    retries,
    delay,
    isSuccess,
    logPrefix,
    logger
  );
}

/**
 * Fetches campaigns for a given config and token.
 */
// Allows passing custom headers for special cases (e.g., referer override)
async function fetchCampaignList(
  cfg,
  cookieString,
  logger,
  customHeaders = {},
  dateRange = null,
  baseUrl = undefined,
  entityCode = undefined,
  accountId = undefined
) {
  // STRUCTURE_CONFIG.getPayload expects { start_date, end_date, accountId }
  const payload = cfg.getPayload
    ? cfg.getPayload({
        start_date: dateRange?.start_date,
        end_date: dateRange?.end_date,
        accountId,
      })
    : {};
  const { params = {}, data = {} } = payload || {};

  const targetUrl = cfg.subUrl.startsWith("http")
    ? cfg.subUrl
    : `${(baseUrl || "").replace(/\/$/, "")}/${entityCode}/${cfg.subUrl}`;

  const method = (cfg.method || "POST").toUpperCase();
  let resp;

  const requestOptions = {
    cookieString,
    headers: { ...customHeaders },
    logger,
    params,
  };

  const retryLogPrefix = `[RETRY][CampaignList]${
    dateRange ? `[range=${dateRange.start_date}..${dateRange.end_date}]` : ""
  }`;

  if (method === "GET") {
    resp = await getWithRetry(
      targetUrl,
      requestOptions,
      null,
      3,
      2000,
      retryLogPrefix,
      logger
    );
  } else {
    resp = await postWithRetry(
      targetUrl,
      data,
      requestOptions,
      null,
      3,
      2000,
      retryLogPrefix,
      logger
    );
  }

  const campaigns = resp.data || [];

  // Save response for debugging
  if (apiDebug) {
    saveResponseToFile("campaigns", resp.data, {
      subDir: "api_responses/campaigns",
      overwrite: true,
      suffix: "latest",
    });
  }

  return campaigns;
}

/**
 * Fetches otherFetch data for a given campaign and config.
 */
// Allows passing custom headers for special cases (e.g., referer override)
async function fetchOtherFetchData(
  fetchConf,
  campaign,
  cookieString,
  logger,
  customHeaders = {},
  dateRange = null,
  pageNumber = null,
  pageSize = null,
  baseUrl = undefined,
  entityCode = undefined,
  accountId = undefined
) {
  // STRUCTURE_CONFIG.getPayload expects { campaignId, start_date, end_date, accountId }
  const payload = fetchConf.getPayload
    ? fetchConf.getPayload({
        campaignId: campaign.campaignCode || campaign.campaign_id,
        start_date: dateRange?.start_date,
        end_date: dateRange?.end_date,
        accountId,
        page: pageNumber,
        size: pageSize,
      })
    : {};
  const { params = {}, data = {} } = payload || {};

  const targetUrl = fetchConf.subUrl.startsWith("http")
    ? fetchConf.subUrl
    : `${(baseUrl || "").replace(/\/$/, "")}/${entityCode}/${fetchConf.subUrl}`;

  const resp = await postWithRetry(
    targetUrl,
    data,
    {
      cookieString,
      headers: { ...customHeaders },
      logger,
      params,
    },
    null,
    3,
    2000,
    `[RETRY][OtherFetch][type=${fetchConf.type || "Unknown"}][campaign=${
      campaign.campaignCode || campaign.campaign_id || "n/a"
    }]${
      dateRange ? `[range=${dateRange.start_date}..${dateRange.end_date}]` : ""
    }${pageNumber != null ? `[page=${pageNumber}]` : ""}`,
    logger
  );

  return resp.data || [];
}

module.exports = {
  postWithRetry,
  getWithRetry,
  fetchCampaignList,
  fetchOtherFetchData,
};
