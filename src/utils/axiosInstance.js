const axios = require("axios");
const { getTalabatApiHeaders } = require("./requestHandler");

// Create a base axios instance
const axiosInstance = axios.create();

// Request interceptor to inject Talabat headers if cookieString is provided
axiosInstance.interceptors.request.use(
  (config) => {
    if (config.cookieString) {
      const excludeHeaders = config.excludeHeaders || [];
      config.headers = getTalabatApiHeaders(
        config.cookieString,
        config.headers || {},
        { excludeHeaders }
      );
      // Optional DEBUG logging of cookie fingerprint and request info
      if (process.env.DEBUG === "true") {
        try {
          const method = (config.method || "GET").toUpperCase();
          const url = config.url;
          const fp = `${config.cookieString.slice(0, 30)}... (len=${
            config.cookieString.length
          })`;
          // eslint-disable-next-line no-console
          console.debug(
            `[axios] ${method} ${url} | Cookie FP: ${fp} | QUICK_MODE=${process.env.QUICK_MODE}`
          );
        } catch (_) {
          // noop
        }
      }
      // For Printing curl
      // function toQueryString(params) {
      //   return Object.entries(params)
      //     .map(
      //       ([key, value]) =>
      //         `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      //     )
      //     .join("&");
      // }
      // let url = config.url;
      // if (config.params && Object.keys(config.params).length > 0) {
      //   const qs = toQueryString(config.params);
      //   url += (url.includes("?") ? "&" : "?") + qs;
      // }
      // const method = (config.method || "POST").toUpperCase();
      // let curl = [`curl -X ${method} '${url}'`];
      // for (const [key, value] of Object.entries(config.headers || {})) {
      //   if (value !== undefined && value !== null) {
      //     curl.push(`-H '${key}: ${value}'`);
      //   }
      // }
      // if (config.data) {
      //   const body =
      //     typeof config.data === "string"
      //       ? config.data
      //       : JSON.stringify(config.data);
      //   curl.push(`-d '${body}'`);
      // }
      // // Use logger if provided, otherwise fallback
      // if (typeof config.logger === "function") {
      //   config.logger(curl.join(" \\\n   ") + "\n\n");
      //   delete config.logger;
      // }
      delete config.cookieString;
      delete config.excludeHeaders;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for Talabat 403 handling
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Only handle 403 from Talabat API requests
    if (error.response && error.response.status === 403) {
      // Optionally: Add logging here
      error.isTalabat403 = true;
      // Optionally: trigger global blocking/refresh logic here if you want to centralize it
    }
    return Promise.reject(error);
  }
);

module.exports = axiosInstance;
