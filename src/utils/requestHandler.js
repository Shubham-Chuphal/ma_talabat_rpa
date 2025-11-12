const { fetchTalabatCookies } = require("../utils/getCookies");

// Track in-flight refreshes per client to avoid duplicate concurrent logins
const _inFlightRefreshByClient = new Map();

/**
 * Generic async retry utility.
 * @param {Function} fn - Async function to execute. Should return a promise.
 * @param {number} maxRetries - Maximum number of attempts.
 * @param {number} delayMs - Delay between attempts (ms).
 * @param {Function} [validateFn] - Optional. Receives result, should return true if successful.
 */
async function retryAsync(
  fn,
  maxRetries = 3,
  delayMs = 2000,
  validateFn = null,
  logPrefix = "[RETRY]",
  logger
) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const result = await fn();
      if (validateFn && !validateFn(result)) {
        throw new Error(`${logPrefix} Validation failed`);
      }
      return result;
    } catch (err) {
      attempt++;
      const msg = `${logPrefix} Attempt ${attempt} failed: ${err.message}`;
      if (typeof logger === "function") {
        try {
          logger(msg, "warn");
        } catch (_) {}
      }
      if (attempt >= maxRetries) throw err;
      await new Promise((res) => setTimeout(res, delayMs));
    }
  }
}

/**
 * Express async handler wrapper.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Returns the standard Talabat API headers for campaign/report requests.
 * @param {string} cookieString - The cookie string for authentication.
 * @param {object} [customHeaders] - Optional additional headers to merge/override.
 */

function getTalabatApiHeaders(token, customHeaders = {}, options = {}) {
  const authHeader =
    typeof token === "string" &&
    token.trim().toLowerCase().startsWith("bearer ")
      ? token.trim()
      : `Bearer ${token}`;
  const defaultHeaders = {
    accept: "application/json, text/plain, */*",
    "accept-language": "en-US,en;q=0.9",
    Authorization: authHeader,
    origin: "https://ads.talabat.com",
    priority: "u=1, i",
    referer: "https://ads.talabat.com/",
    // Match browser fingerprint from the provided curl
    "sec-ch-ua":
      '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Linux"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site",
    "user-agent":
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
  };

  // Only add content-type for non-GET requests
  if (!options.isGetRequest) {
    defaultHeaders["content-type"] = "application/json";
  }

  // Remove headers if options.excludeHeaders is set
  if (options.excludeHeaders) {
    options.excludeHeaders.forEach((header) => {
      delete defaultHeaders[header];
    });
  }

  // Merge with any custom headers passed
  return {
    ...defaultHeaders,
    ...customHeaders,
  };
}

/**
 * Single-flight cookie refresh: if a refresh for the same clientId is already in-flight,
 * wait for it and reuse the result instead of starting another login.
 * @param {string|number} clientId
 * @returns {Promise<Array<{[store:string]: string}>>>}
 */
async function refreshCookiesSingleFlight(clientId) {
  if (!clientId) throw new Error("clientId is required for cookie refresh");
  // If a refresh is already running, await it
  if (_inFlightRefreshByClient.has(clientId)) {
    console.log(`⏳ Cookie refresh already in progress for client ${clientId}, waiting...`);
    return _inFlightRefreshByClient.get(clientId);
  }
  // Start a new refresh and record the promise
  console.log(`🔄 Starting new cookie refresh for client ${clientId}`);
  const refreshPromise = (async () => {
    try {
      return await fetchTalabatCookies(clientId);
    } finally {
      // Ensure cleanup regardless of success/failure so future attempts can retry
      _inFlightRefreshByClient.delete(clientId);
    }
  })();
  _inFlightRefreshByClient.set(clientId, refreshPromise);
  return refreshPromise;
}

async function requestWithCookieRenewal(apiCallFn, args, options) {
  const { retryCount = 2, tokenMap, storeKey, clientId } = options;
  let attempt = 0;
  console.log("args:", args);
  while (attempt < retryCount) {
    const cookie = tokenMap?.[storeKey];
    if (!cookie) throw new Error(`No cookie found for store: ${storeKey}`);

    try {
      // Call the passed API function with args + cookie at the end
      return await apiCallFn(...args, cookie);
    } catch (error) {
      const status = error.response?.status;
      const shouldRefresh = status === 401 || status === 403;

      if (shouldRefresh && attempt < retryCount - 1) {
        console.log(`🔑 Token expired (${status}), refreshing cookies for client ${clientId}...`);
        // Refresh cookies with single-flight guarantee and update tokenMap
        const updatedCookies = await refreshCookiesSingleFlight(clientId);
        updatedCookies.forEach((item) => {
          const [store, newCookie] = Object.entries(item)[0];
          tokenMap[store] = newCookie;
        });
        attempt++;
        console.log(`✅ Cookies refreshed, retrying attempt ${attempt + 1}/${retryCount}`);
        continue; // retry with new cookie
      }
      throw error;
    }
  }
  throw new Error("Max retry attempts reached");
}

module.exports = {
  asyncHandler,
  retryAsync,
  getTalabatApiHeaders,
  refreshCookiesSingleFlight,
  requestWithCookieRenewal,
};
