const { config, getTalabatBaseUrlForClient } = require("../config");
const axiosInstance = require("../utils/axiosInstance");
const { requestWithCookieRenewal } = require("../utils/requestHandler");

function getApiUrl(suffix, clientId = null) {
  // If clientId is provided, use client-specific config
  if (clientId) {
    const { baseUrl, entityCode } = getTalabatBaseUrlForClient(clientId);
    return `${baseUrl}${entityCode}/${suffix}`;
  }
  
  // Fallback to old behavior if no clientId
  return `${config.talabat.apiUrl || ""}${suffix}`;
}

/**
 * Makes an API call to Talabat's PAS API with proper authentication
 * @param {string} url - The API endpoint URL
 * @param {object} payload - The request payload
 * @param {object} [options] - Additional options (req, retryCount, retryDelay)
 * @returns {Promise<object>} API response data
 */

async function actionApiCall(url, payload, options = {}) {
  const { storeKey, tokenMap, retryCount = 3, clientId, method = "POST" } = options;

  return await requestWithCookieRenewal(
    async (url, payload, method ,cookie) => {
      const axiosConfig = {
        cookieString: cookie,
        excludeHeaders: [
          "Origin",
          "Sec-Fetch-Dest",
          "Sec-Fetch-Mode",
          "Sec-Fetch-Site",
        ],
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          Accept: "application/json, text/plain, */*",
        },
      };

      let response;
      const httpMethod = method.toUpperCase();
      
      if (httpMethod === "PATCH") {
        response = await axiosInstance.patch(url, payload, axiosConfig);
      } else if (httpMethod === "PUT") {
        response = await axiosInstance.put(url, payload, axiosConfig);
      } else {
        response = await axiosInstance.post(url, payload, axiosConfig);
      }

      if (response.status != 200) {
        throw new Error(response.data.msg || "Talabat API request failed");
      }
      return response.data;
    },
    [url, payload, method, cookie],
    { storeKey, tokenMap, retryCount, clientId }
  );
}

module.exports = { getApiUrl, actionApiCall };
