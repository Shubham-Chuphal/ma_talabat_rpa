const { config } = require("../config");
const axiosInstance = require("../utils/axiosInstance");
const { requestWithCookieRenewal } = require("../utils/requestHandler");

function getApiUrl(suffix) {
  return `${config.talabat.apiUrl}${suffix}`;
}

/**
 * Makes an API call to Talabat's PAS API with proper authentication
 * @param {string} url - The API endpoint URL
 * @param {object} payload - The request payload
 * @param {object} [options] - Additional options (req, retryCount, retryDelay)
 * @returns {Promise<object>} API response data
 */

async function actionApiCall(url, payload, options = {}) {
  const { storeKey, tokenMap, retryCount = 3, clientId } = options;

  return await requestWithCookieRenewal(
    async (url, payload, cookie) => {
      const response = await axiosInstance.post(url, payload, {
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
      });

      if (response.status != 200) {
        throw new Error(response.data.msg || "Talabat API request failed");
      }
      return response.data;
    },
    [url, payload],
    { storeKey, tokenMap, retryCount, clientId }
  );
}

module.exports = { getApiUrl, actionApiCall };
