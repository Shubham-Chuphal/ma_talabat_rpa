// Utility to fetch Talabat token info from DB, parse, and transform to array-of-objects format
// Usage: await fetchTalabatTokenArray({ clientId, platformId, commonDB })
const { chromium } = require("playwright");
const { getTokenByClientAndPlatform } = require("../services/dbOperation");
const { getConnectedDatabases } = require("../db/connect");
const { getBrandsByClientId } = require("../services/dbOperation");
const { writeDebugLog } = require("../utils/debugLog");
const { config } = require("../config/index");

// Timeouts for waiting on API calls
const API_WAIT_TIMEOUT_MS = 90000; // 90sde
const FALLBACK_WAIT_MS = 30000; // 30s

// Load client configuration
function loadClientConfig(clientId) {
  if (!process.env.TALABAT_CONFIG_BASED_CLIENT) {
    throw new Error(
      "TALABAT_CONFIG_BASED_CLIENT is not defined in environment variables"
    );
  }

  const config = JSON.parse(process.env.TALABAT_CONFIG_BASED_CLIENT);
  const clientConfig = config[clientId];

  if (!clientConfig) {
    throw new Error(`No configuration found for clientId: ${clientId}`);
  }

  return clientConfig;
}

/**
 * Fetch Talabat token info from DB, parse, and transform to array-of-objects [{store: cookieString}, ...]
 * @param {object} params
 * @param {string|number} params.clientId
 * @param {string|number} params.platformId
 * @param {object} params.commonDB - DB connection (i.e., db.common)
 * @returns {Promise<Array<object>>}
 */
async function fetchTalabatTokenArray({ clientId, platformId, commonDB }) {
  const tokenInfo = await getTokenByClientAndPlatform(
    clientId,
    platformId,
    commonDB
  );
  if (!tokenInfo?.token_data)
    throw new Error("Token info not found for client/platform");
  let tokenInfoRaw = tokenInfo.token_data;
  let tokenInfoObj;
  if (typeof tokenInfoRaw === "string") {
    try {
      tokenInfoObj = JSON.parse(tokenInfoRaw);
    } catch (e) {
      throw new Error("Failed to parse token_data from DB: " + e.message);
    }
  } else {
    tokenInfoObj = tokenInfoRaw;
  }
  // Transform to array-of-objects [{store: cookieString}, ...]
  let tokenInfoArray = [];
  if (Array.isArray(tokenInfoObj)) {
    tokenInfoArray = tokenInfoObj;
  } else if (tokenInfoObj && typeof tokenInfoObj === "object") {
    tokenInfoArray = Object.entries(tokenInfoObj).map(
      ([store, cookieString]) => ({ [store]: cookieString })
    );
  } else {
    throw new Error("token_data from DB is not in expected format");
  }
  return tokenInfoArray;
}

/**
 * Login to Talabat and persist cookies.
 * @param {object} clientConfig - Client configuration with EMAIL, PASSWORD, and TALABAT_LOGIN_URL
 * @param {string} clientId - Client ID for logging
 * @returns {Promise<{success:boolean,cookies:Array}|{success:false,message:string}>}
 */

async function loginTalabat(clientConfig) {
  const { EMAIL, PASSWORD, TALABAT_LOGIN_URL } = clientConfig;

  const browser = await chromium.launch({
    headless: true,
    slowMo: 80,
  });

  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  let bearerToken = null;

  // ✅ GLOBAL TOKEN CAPTURE (covers popup, redirects, hidden frames)
  context.on("response", async (res) => {
    try {
      const url = res.url();
      if (url.includes("/oauth2/token")) {
        const json = await res.json();
        if (json?.access_token) {
          bearerToken = json.access_token;
          console.log("✅ ✅ TOKEN CAPTURED:", bearerToken);
        }
      }
    } catch (err) {
      console.log("Token parse error:", err.message);
    }
  });

  try {
    // Step 1: Open main page
    await page.goto(TALABAT_LOGIN_URL, { waitUntil: "domcontentloaded" });

    // Step 2: Handle popup
    const [popup] = await Promise.all([
      page.waitForEvent("popup"),
      page.click("button:has-text('Login')"),
    ]);

    console.log("✅ Popup opened");

    await popup.waitForLoadState("domcontentloaded");

    // Step 3: Login
    await popup.fill('input[name="email"]', EMAIL);
    await popup.fill('input[name="password"]', PASSWORD);
    await popup.click("button:has-text('LOG IN')");

    console.log("Login submitted");

    // Step 4: Popup closes
    await popup.waitForEvent("close", { timeout: 25000 });

    // Step 5: Main page reloads logged in
    await page.waitForLoadState("networkidle");

    // Wait a bit for token redirect page to execute request
    await page.waitForTimeout(5000);

    // Step 6: Capture cookies
    const cookies = await context.cookies();

    await browser.close();

    return {
      success: true,
      cookies,
      bearerToken,
    };

  } catch (err) {
    console.error("loginTalabat error:", err);
    return { success: false, message: err.message };
  }
}


/**
 * Fetch fresh Talabat cookies by logging in with Playwright.
 * @param {string|number} clientId - The client ID
 * @returns {Promise<Array<{[store: string]: string}>>} Array of cookie objects
 */
async function fetchTalabatCookies(clientId) {
  const LOG_FILE = "debug_cookies.txt";

  try {
    if (!clientId) {
      throw new Error("clientId is required");
    }
        // Load client configuration
    const clientConfig = loadClientConfig(clientId);
    const { commonDB: pgCommonDB } = await getConnectedDatabases(clientId);
    const brands = await getBrandsByClientId(clientId, pgCommonDB);
    writeDebugLog(`Fetched ${brands.length} brands`, LOG_FILE);


    if (!clientConfig.EMAIL || !clientConfig.PASSWORD) {
      throw new Error("Email and Password are not configured for this client");
    }
    console.log("clientConfig", clientConfig);
    console.log("[brands[0]?.brand_id]:", [brands[0]?.brand_id]);

    // Retry login a few times before failing hard
    const MAX_LOGIN_ATTEMPTS = 2;
    const RETRY_DELAY_MS = 3000;
    let result = null;
    let lastErr = null;
    for (let attempt = 1; attempt <= MAX_LOGIN_ATTEMPTS; attempt++) {
      try {
        result = await loginTalabat(clientConfig, clientId);
        if (result?.success) break;
        // Wrap unsuccessful result into an error to drive retry
        lastErr = new Error(result?.message || "Failed to get cookies");
      } catch (e) {
        lastErr = e;
      }
      if (attempt < MAX_LOGIN_ATTEMPTS) {
        writeDebugLog(
          `[loginTalabat] Attempt ${attempt} failed: ${lastErr?.message}. Retrying in ${RETRY_DELAY_MS}ms...`,
          LOG_FILE
        );
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    }
    if (!result?.success) {
      throw new Error(
        lastErr?.message || "Failed to get cookies after retries"
      );
    }
    console.log("cookies", [brands[0]?.brand_id] + " : " + result.cookies);

    // Update DB only if success

    // const cookieString = result?.cookies
    //   .map((cookie) => `${cookie.name}=${cookie.value}`)
    //   .join(";");

    if (pgCommonDB?.models?.e_genie_platform_mapping && result.success) {
      await pgCommonDB.models.e_genie_platform_mapping.update(
        {
          token_data: {
            [brands[0]?.brand_id]: result.bearerToken,
          },
        },
        { where: { client_id: clientId } }
      );
      writeDebugLog(
        `Updated DB with cookies for client_id: ${clientId}`,
        LOG_FILE
      );
      return [
        {
          [brands[0]?.brand_id]: result.bearerToken,
        },
      ];
    }
    // If we reached here without DB update, treat as a failure state
    throw new Error("Unexpected state while updating cookies");
  } catch (error) {
    writeDebugLog(`Fatal error fetching cookies: ${error.message}`, LOG_FILE);
    throw new Error(`Fatal error fetching cookies: ${error.message}`);
  }
}

module.exports = { fetchTalabatTokenArray, fetchTalabatCookies, loadClientConfig };
