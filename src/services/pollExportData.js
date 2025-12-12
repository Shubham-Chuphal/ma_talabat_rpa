const { fetchTalabatCookies } = require("../utils/getCookies");
const { fetchCampaignList, fetchOtherFetchData } = require("./apiHelpers.js");

// Simple sleep helper for pacing/throttling
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Single-flight guard for cookie refresh per clientId
const cookieRefreshInFlight = new Map(); // clientId -> Promise<Array<Object>>

// Adaptive throttling state (Talabat)
let recent429At = 0; // timestamp of last 429
const THROTTLE_WINDOW_MS = parseInt(
  process.env.TALABAT_THROTTLE_WINDOW_MS || "20000",
  10
);

function isSlowMode() {
  return Date.now() - recent429At < THROTTLE_WINDOW_MS;
}

// Ensure dates are logged as readable strings
function fmtDate(d) {
  if (typeof d === "string") return d;
  try {
    if (d && typeof d.toISOString === "function") return d.toISOString();
  } catch (_) {}
  try {
    return JSON.stringify(d);
  } catch (_) {
    return String(d);
  }
}

// Global request gate with AIMD tuning
let currentGlobalReqLimit = 2; // initial capacity (moderate)
let globalReqInFlight = 0;
const globalReqQueue = [];
let currentMinReqIntervalMs = 450; // pacing between starts (moderate)
let nextGlobalAvailableAt = 0;

const TUNE_GRC_FLOOR = parseInt(process.env.TALABAT_TUNE_GRC_FLOOR || "2", 10);
const TUNE_GRC_CEIL = parseInt(process.env.TALABAT_TUNE_GRC_CEIL || "4", 10);
const TUNE_MRI_FLOOR_MS = parseInt(
  process.env.TALABAT_TUNE_MRI_FLOOR_MS || "300",
  10
);
const TUNE_MRI_CEIL_MS = parseInt(
  process.env.TALABAT_TUNE_MRI_CEIL_MS || "800",
  10
);
const TUNE_STEP_UP_INTERVAL_MS = parseInt(
  process.env.TALABAT_TUNE_STEP_UP_INTERVAL_MS || "60000",
  10
);
const TUNE_STEP_DOWN_GRC_DELTA = parseInt(
  process.env.TALABAT_TUNE_STEP_DOWN_GRC_DELTA || "1",
  10
);
const TUNE_STEP_DOWN_MRI_DELTA = parseInt(
  process.env.TALABAT_TUNE_STEP_DOWN_MRI_DELTA || "75",
  10
);
const TUNE_STEP_UP_GRC_DELTA = parseInt(
  process.env.TALABAT_TUNE_STEP_UP_GRC_DELTA || "1",
  10
);
const TUNE_STEP_UP_MRI_DELTA = parseInt(
  process.env.TALABAT_TUNE_STEP_UP_MRI_DELTA || "35",
  10
);
let lastTuneUpAt = 0;

function note429AndTuneDown(logger) {
  recent429At = Date.now();
  if (currentGlobalReqLimit > TUNE_GRC_FLOOR) {
    const prev = currentGlobalReqLimit;
    currentGlobalReqLimit = Math.max(
      TUNE_GRC_FLOOR,
      currentGlobalReqLimit - TUNE_STEP_DOWN_GRC_DELTA
    );
    if (prev !== currentGlobalReqLimit) {
      logger(
        `[auto-tune] GRC down: ${prev} -> ${currentGlobalReqLimit}`,
        "warn"
      );
    }
  }
  if (currentMinReqIntervalMs < TUNE_MRI_CEIL_MS) {
    const prev = currentMinReqIntervalMs;
    currentMinReqIntervalMs = Math.min(
      TUNE_MRI_CEIL_MS,
      currentMinReqIntervalMs + TUNE_STEP_DOWN_MRI_DELTA
    );
    if (prev !== currentMinReqIntervalMs) {
      logger(
        `[auto-tune] MRI up: ${prev}ms -> ${currentMinReqIntervalMs}ms`,
        "warn"
      );
    }
  }
}

function maybeTuneUp(logger) {
  const now = Date.now();
  if (
    now - recent429At >= TUNE_STEP_UP_INTERVAL_MS &&
    now - lastTuneUpAt >= TUNE_STEP_UP_INTERVAL_MS
  ) {
    const prevGrc = currentGlobalReqLimit;
    const prevMri = currentMinReqIntervalMs;
    if (currentGlobalReqLimit < TUNE_GRC_CEIL) {
      currentGlobalReqLimit = Math.min(
        TUNE_GRC_CEIL,
        currentGlobalReqLimit + TUNE_STEP_UP_GRC_DELTA
      );
    }
    if (currentMinReqIntervalMs > TUNE_MRI_FLOOR_MS) {
      currentMinReqIntervalMs = Math.max(
        TUNE_MRI_FLOOR_MS,
        currentMinReqIntervalMs - TUNE_STEP_UP_MRI_DELTA
      );
    }
    lastTuneUpAt = now;
    if (
      prevGrc !== currentGlobalReqLimit ||
      prevMri !== currentMinReqIntervalMs
    ) {
      logger(
        `[auto-tune] Step-up: GRC ${prevGrc}->${currentGlobalReqLimit}, MRI ${prevMri}ms->${currentMinReqIntervalMs}ms`,
        "info"
      );
    }
  }
}

function acquireGlobalReq() {
  return new Promise((resolve) => {
    if (globalReqInFlight < currentGlobalReqLimit) {
      globalReqInFlight++;
      resolve();
    } else {
      globalReqQueue.push(resolve);
    }
  });
}

function releaseGlobalReq() {
  globalReqInFlight = Math.max(0, globalReqInFlight - 1);
  const next = globalReqQueue.shift();
  if (next) {
    globalReqInFlight++;
    next();
  }
}

async function withGlobalRequestGate(fn, logger) {
  try {
    maybeTuneUp(logger);
  } catch (_) {}
  await acquireGlobalReq();
  try {
    const now = Date.now();
    const waitMs = Math.max(0, nextGlobalAvailableAt - now);
    if (waitMs > 0) await new Promise((r) => setTimeout(r, waitMs));
    nextGlobalAvailableAt =
      Math.max(Date.now(), nextGlobalAvailableAt) + currentMinReqIntervalMs;
    return await fn();
  } catch (err) {
    if (err?.response?.status === 429) {
      try {
        note429AndTuneDown(logger);
      } catch (_) {}
    }
    throw err;
  } finally {
    releaseGlobalReq();
  }
}

/**
 * Fetch Talabat campaign details, handle 401 by refreshing cookies via Lambda.

 * @param {Array<Object>} cookieArray - Array of cookie objects for Noon stores
 * @param {Object} brandLookup - Brand ID to name mapping
 * @param {string|number} [clientId] - The client ID to use for cookie refresh on 401
 * @param {Object} [existingData] - Existing campaign data for deduplication/merging
 * @returns {Promise<Array<{store: string, campaigns?: Array<Object>, error?: string, timestamp?: string, attempt?: number}>>}
 */

const MAX_TRIES = 2;

// Concurrency controls (configurable via env)
const CAMPAIGN_CONCURRENCY = parseInt(
  process.env.TALABAT_CONCURRENCY_CAMPAIGNS || "2",
  10
);
const FETCH_CONCURRENCY = parseInt(
  process.env.TALABAT_CONCURRENCY_FETCHES || "2",
  10
);

// Simple bounded concurrency helper
async function withConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let index = 0;

  async function run() {
    while (true) {
      const current = index++;
      if (current >= items.length) break;
      results[current] = await worker(items[current], current);
    }
  }

  const runners = Array.from(
    { length: Math.min(limit, items.length || 0) },
    () => run()
  );
  await Promise.all(runners);
  return results;
}

async function processSingleToken(
  cookieString,
  cookieKey,
  existingData,
  brandLookup,
  CONFIG,
  date = null,
  logger,
  options = {}
) {
  // Per-call concurrency overrides (fallback to module-level defaults)
  const CAMPAIGN_CONCURRENCY_EFF = parseInt(
    options.campaignConcurrency || CAMPAIGN_CONCURRENCY,
    10
  );
  const FETCH_CONCURRENCY_EFF = parseInt(
    options.fetchConcurrency || FETCH_CONCURRENCY,
    10
  );
  // Reserved for future bounded-parallel pagination if enabled again
  const PAGE_CONCURRENCY_EFF = parseInt(options.pageConcurrency, 10);
  let had401Token = false;
  let error = null;
  let success = true;
  // Sequential-mode delays (ms). Only used when options.sequential === true
  const SEQ_FETCH_DELAY_MS = parseInt(
    process.env.TALABAT_SEQ_FETCH_DELAY_MS || "0",
    10
  );
  const SEQ_CAMPAIGN_DELAY_MS = parseInt(
    process.env.TALABAT_SEQ_CAMPAIGN_DELAY_MS || "0",
    10
  );

  const output = {
    campaigns: [],
    products: [],
    categories: [],
    keywords: [],
    slots: [],
  };

  // Resume support: options.resumeFrom = { adType: string, index: number }
  const resumeAdType =
    options && options.resumeFrom ? options.resumeFrom.adType : null;
  const resumeIndex =
    options && options.resumeFrom && Number.isInteger(options.resumeFrom.index)
      ? options.resumeFrom.index
      : -1;
  let lastAdType = null;
  let lastCampaignIndex = -1;
  let resumeFromHint = null; // { adType, index, fetchType, page }

  // From controller via middleware
  const baseUrl = options.baseUrl;
  const entityCode = options.entityCode;

  for (const adTypeObj of CONFIG) {
    const adType = Object.keys(adTypeObj)[0];
    const [config] = adTypeObj[adType];

    logger(
      `Processing ad type: ${adType}${date ? ` [date=${fmtDate(date)}]` : ""}`,
      "debug"
    );
    if (process.env.DEBUG === "true") {
      logger(`Using config: ${JSON.stringify(config, null, 2)}`, "debug");
    }

    // Campaign list with 429 backoff and global gate
    let campaigns = [];
    {
      let attempt = 0;
      const maxRetries = 1; // keep small; slow-mode window will pace further
      while (true) {
        try {
          if (had401Token) {
            // Abort starting new requests when a 401 has been detected
            throw new Error("ABORT_401");
          }
          campaigns = await withGlobalRequestGate(
            () =>
              fetchCampaignList(
                config,
                cookieString,
                logger,
                {},
                date,
                baseUrl,
                entityCode,
                /* accountId */ cookieKey
              ),
            logger
          );
          break;
        } catch (err) {
          if (String(err && err.message) === "ABORT_401") {
            error = err;
            success = false;
            break;
          }
          if (err.response?.status === 401 || err.response?.status === 403) {
            logger(`[401] Unauthorized - Token expired for ${adType}`, "error");
            return {
              ...output,
              had401Token: true,
              error: err,
              success: false,
            };
          }

          if (err.response?.status === 429 && attempt < maxRetries) {
            recent429At = Date.now();
            const ra = err.response?.headers?.["retry-after"];
            const delay =
              ra && !Number.isNaN(Number(ra)) ? Number(ra) * 1000 : 500;
            logger(
              `[429/backoff] Campaign list for ${adType} (token=${cookieKey})${
                date ? ` [date=${fmtDate(date)}]` : ""
              }; sleeping ${delay}ms`,
              "warn"
            );
            await sleep(delay);
            attempt++;
            continue;
          }
          logger(
            `Error fetching campaign list for ${adType}: ${err.message}`,
            "error"
          );
          campaigns = [];
          error = err;
          success = false;
          break;
        }
      }
    }

    const campaignData = config.dataExtractor
      ? config.dataExtractor(campaigns)
      : campaigns?.unformattedData || [];

    const createdOn = typeof date === "string" ? date : date?.start_date;
    const formattedCampaigns = config.format
      ? campaignData.map((row) =>
          config.format(
            row,
            brandLookup,
            cookieKey,
            existingData,
            adType,
            createdOn
          )
        )
      : campaignData;

    output.campaigns.push(...formattedCampaigns);
    logger(
      `Processing ${formattedCampaigns.length} campaigns${
        date ? ` [date=${fmtDate(date)}]` : ""
      } [adType=${adType}]`,
      "info"
    );

    // Deduplicate otherFetch by type once per adType
    const fetchesRaw = config.otherFetch || [];
    const fetches = Array.from(
      new Map(fetchesRaw.map((f) => [f.type, f])).values()
    );

    if (fetches.length === 0) {
      logger(
        `No otherFetch configured for ${adType}. Skipping per-campaign fetches.`,
        "info"
      );
      // Nothing more to do for this adType
      continue;
    }

    // Process campaigns: parallel by default, sequential when options.sequential
    const campaignWorker = async (campaign, index) => {
      if (had401Token) return; // do not start new work after 401
      lastAdType = adType;
      lastCampaignIndex = index;
      logger(
        `Processing campaign ${index + 1}/${formattedCampaigns.length}: ${
          campaign.campaign_name ||
          campaign.campaign_id ||
          campaign.campaignName ||
          campaign.campaignCode ||
          "unknown"
        }${date ? ` [date=${fmtDate(date)}]` : ""} [adType=${adType}]`,
        "info"
      );

      // Worker with retries and global gate per fetchConf
      const doFetchWithRetry = async (fetchConf) => {
        if (had401Token)
          return { ok: false, err: new Error("ABORT_401"), fatal401: false };
        logger(
          `Fetching ${fetchConf.type} data${
            date ? ` [date=${fmtDate(date)}]` : ""
          } [adType=${adType}]`,
          "debug"
        );
        let attempt = 0;
        const maxRetries = 1; // reduced retries to moderate server load
        while (true) {
          try {
            if (had401Token) throw new Error("ABORT_401");
            const data = await withGlobalRequestGate(
              () =>
                fetchOtherFetchData(
                  fetchConf,
                  campaign,
                  cookieString,
                  logger,
                  {},
                  date,
                  undefined,
                  undefined,
                  baseUrl,
                  entityCode,
                  /* accountId */ cookieKey
                ),
              logger
            );

            return { ok: true, data };
          } catch (err) {
            if (String(err && err.message) === "ABORT_401") {
              return { ok: false, err, fatal401: false };
            }
            if (err.response?.status === 401) {
              logger(
                `[401] Unauthorized - Token expired while fetching ${fetchConf.type}`,
                "error"
              );
              return { ok: false, err, fatal401: true };
            }
            // Retry on 5xx and common network timeouts
            const status = err.response?.status;
            const code = err.code || "";
            const isRetryableHttp =
              typeof status === "number" &&
              ((status >= 500 && status < 600) || status === 429);
            const isNetworkTimeout =
              code === "ETIMEDOUT" ||
              code === "ESOCKETTIMEDOUT" ||
              code === "ECONNRESET" ||
              (err.message || "").toLowerCase().includes("timeout");

            if ((isRetryableHttp || isNetworkTimeout) && attempt < maxRetries) {
              const retryAfter = err.response?.headers?.["retry-after"];
              let delay;
              if (retryAfter && !Number.isNaN(Number(retryAfter))) {
                delay = Number(retryAfter) * 1000;
              } else {
                // modest backoff with jitter 1.5s - 2.5s
                delay = 1500 + Math.floor(Math.random() * 1000);
              }
              logger(
                `[RETRY] Attempt ${attempt + 1} failed for ${fetchConf.type}${
                  date ? ` on ${fmtDate(date)}` : ""
                } (campaign=${
                  campaign.campaign_name ||
                  campaign.campaign_id ||
                  campaign.campaignName ||
                  campaign.campaignCode ||
                  "n/a"
                }): ${err.message} (sleep ${delay}ms)`,
                "warn"
              );
              await sleep(delay);
              attempt++;
              continue;
            }

            // Final failure after retries
            logger(
              `[ERROR] Final error fetching ${fetchConf.type}${
                date ? ` on ${fmtDate(date)}` : ""
              } (campaign=${
                campaign.campaign_name ||
                campaign.campaign_id ||
                campaign.campaignName ||
                campaign.campaignCode ||
                "n/a"
              }) after ${attempt} retries: ${err.message}`,
              "error"
            );
            return { ok: false, err, fatal401: false };
          }
        }
      };

      // Helper to detect the container key that holds metadata and unformattedData
      const detectContainer = (respData) => {
        if (!respData || typeof respData !== "object")
          return { key: null, container: null };
        const preferredKeys = [
          "products",
          "targets",
          "slotPlacements",
          "sources",
        ];
        for (const k of preferredKeys) {
          const v = respData[k];
          if (v && typeof v === "object" && v.unformattedData && v.metadata) {
            return { key: k, container: v };
          }
        }
        // Fallback: scan any key that matches the shape
        for (const [k, v] of Object.entries(respData)) {
          if (v && typeof v === "object" && v.unformattedData && v.metadata) {
            return { key: k, container: v };
          }
        }
        return { key: null, container: null };
      };

      // For each campaign, run the retryable fetch workers: sequential if requested
      const runFetchConf = async (fetchConf) => {
        // If this fetch attaches directly to campaign (e.g., negative keywords), keep single call behavior
        if (fetchConf.attachToCampaign) {
          if (had401Token) return;
          const { ok, data, err, fatal401 } = await doFetchWithRetry(fetchConf);

          if (fatal401) {
            had401Token = true;
            error = err;
            success = false;
            // Single-call attach case: set page=1 for resume
            resumeFromHint = {
              adType,
              index,
              fetchType: fetchConf.type,
              page: 1,
            };
            return; // Abort this campaign's fetches
          }

          if (!ok) {
            error = err; // non-fatal error
            success = false;
          }

          if (had401Token) return; // stop further processing for this campaign

          const finalData = ok ? data : [];

          const extracted = fetchConf.dataExtractor
            ? fetchConf.dataExtractor(finalData)
            : [finalData];

          campaign[fetchConf.attachToCampaign] =
            extracted[0]?.negativeKeywords || [];

          logger(
            `Attached ${fetchConf.attachToCampaign} to campaign ${
              campaign.campaign_name ||
              campaign.campaign_id ||
              campaign.campaignName ||
              campaign.campaignCode ||
              "unknown"
            }`,
            "debug"
          );
          return;
        }

        // Paginated flow for normal list fetches
        const ACC = [];
        // Determine starting page for resume if applicable
        let pageNumber = 1;
        if (
          resumeAdType === adType &&
          resumeIndex >= 0 &&
          index === resumeIndex &&
          options &&
          options.resumeFrom &&
          options.resumeFrom.fetchType === fetchConf.type &&
          Number.isInteger(options.resumeFrom.page) &&
          options.resumeFrom.page > 0
        ) {
          pageNumber = options.resumeFrom.page;
          logger(
            `Resuming ${fetchConf.type} at page ${pageNumber} for campaign ${
              campaign.campaign_name ||
              campaign.campaign_id ||
              campaign.campaignName ||
              campaign.campaignCode ||
              "unknown"
            } [adType=${adType}]`,
            "info"
          );
        }
        const desiredPageSize = 500;
        let totalPages = 1;
        let totalCountExpected = null;

        // Helper to fetch a single page with retries and global rate gate
        const fetchPage = async (p) => {
          let attempt = 0;
          const maxRetries = 1;
          while (true) {
            try {
              if (had401Token) throw new Error("ABORT_401");
              const resp = await withGlobalRequestGate(
                () =>
                  fetchOtherFetchData(
                    fetchConf,
                    campaign,
                    cookieString,
                    logger,
                    {},
                    date,
                    p,
                    desiredPageSize,
                    baseUrl,
                    entityCode,
                    /* accountId */ cookieKey
                  ),
                logger
              );
              return { ok: true, data: resp };
            } catch (err) {
              if (String(err && err.message) === "ABORT_401") {
                return { ok: false, err, fatal401: false };
              }
              if (err.response?.status === 401) {
                return { ok: false, err, fatal401: true };
              }
              const status = err.response?.status;
              const code = err.code || "";
              const isRetryableHttp =
                typeof status === "number" &&
                ((status >= 500 && status < 600) || status === 429);
              const isNetworkTimeout =
                code === "ETIMEDOUT" ||
                code === "ESOCKETTIMEDOUT" ||
                code === "ECONNRESET" ||
                (err.message || "").toLowerCase().includes("timeout");
              if (
                (isRetryableHttp || isNetworkTimeout) &&
                attempt < maxRetries
              ) {
                const retryAfter = err.response?.headers?.["retry-after"];
                let delay;
                if (retryAfter && !Number.isNaN(Number(retryAfter))) {
                  delay = Number(retryAfter) * 1000;
                } else {
                  delay = 1500 + Math.floor(Math.random() * 1000);
                }
                logger(
                  `[RETRY] Attempt ${attempt + 1} failed for ${fetchConf.type}${
                    date ? ` on ${fmtDate(date)}` : ""
                  } (campaign=${
                    campaign.campaign_name ||
                    campaign.campaign_id ||
                    campaign.campaignName ||
                    campaign.campaignCode ||
                    "n/a"
                  }) page=${p}, size=${desiredPageSize}: ${
                    err.message
                  } (sleep ${delay}ms)`,
                  "warn"
                );
                await sleep(delay);
                attempt++;
                continue;
              }
              return { ok: false, err, fatal401: false };
            }
          }
        };

        // 1) Probe first page (or resume start page) sequentially to learn pagination
        if (!had401Token) {
          const { ok, data, err, fatal401 } = await fetchPage(pageNumber);
          if (fatal401) {
            had401Token = true;
            error = err;
            success = false;
            // Set resume hint for this page
            resumeFromHint = {
              adType,
              index,
              fetchType: fetchConf.type,
              page: pageNumber,
            };
          } else if (!ok) {
            error = err; // non-fatal error
            success = false;
          } else {
            const { key: containerKey, container } = detectContainer(
              data || {}
            );
            if (!containerKey || !container) {
              const rows = fetchConf.dataExtractor
                ? fetchConf.dataExtractor(data)
                : data?.unformattedData || [];
              ACC.push(...(Array.isArray(rows) ? rows : []));
            } else {
              const meta = container.metadata || {};
              const rows = Array.isArray(container.unformattedData)
                ? container.unformattedData
                : [];
              const totalCount = Number(meta.totalCount || rows.length || 0);
              totalCountExpected = Number.isFinite(totalCount)
                ? totalCount
                : rows.length || 0;
              const actualPageSize = Number(meta.pageSize || desiredPageSize);
              totalPages =
                actualPageSize > 0
                  ? Math.ceil(totalCountExpected / actualPageSize)
                  : 1;
              logger(
                `Detected pagination for ${
                  fetchConf.type
                }: totalCount=${totalCountExpected}, pageSize=${actualPageSize}, totalPages=${totalPages}${
                  date ? ` [date=${fmtDate(date)}]` : ""
                } [adType=${adType}] (campaign=${
                  campaign.campaign_name ||
                  campaign.campaign_id ||
                  campaign.campaignName ||
                  campaign.campaignCode ||
                  "unknown"
                })`,
                "debug"
              );
              ACC.push(...rows);
            }
          }
        }

        // 2) Fetch remaining pages in bounded parallel if no 401 occurred
        if (!had401Token && totalPages > pageNumber) {
          const remainingPages = [];
          for (let p = pageNumber + 1; p <= totalPages; p++)
            remainingPages.push(p);
          await withConcurrency(
            remainingPages,
            PAGE_CONCURRENCY_EFF,
            async (p) => {
              if (had401Token) return;
              const { ok, data, err, fatal401 } = await fetchPage(p);
              if (fatal401) {
                had401Token = true;
                error = err;
                success = false;
                // Set precise resume point
                resumeFromHint = {
                  adType,
                  index,
                  fetchType: fetchConf.type,
                  page: p,
                };
                return;
              }
              if (!ok) {
                error = err;
                success = false;
                return;
              }
              const { key: containerKey, container } = detectContainer(
                data || {}
              );
              if (!containerKey || !container) {
                const rows = fetchConf.dataExtractor
                  ? fetchConf.dataExtractor(data)
                  : data?.unformattedData || [];
                ACC.push(...(Array.isArray(rows) ? rows : []));
                return;
              }
              const rows = Array.isArray(container.unformattedData)
                ? container.unformattedData
                : [];
              ACC.push(...rows);
            }
          );
        }

        if (had401Token) return; // stop further processing for this campaign

        // Cap to expected total if we accidentally over-fetched
        if (totalCountExpected != null && ACC.length > totalCountExpected) {
          const extra = ACC.length - totalCountExpected;
          logger(
            `Capping ${
              fetchConf.type
            } accumulated rows by ${extra} to match totalCount=${totalCountExpected} (campaign=${
              campaign.campaign_name ||
              campaign.campaign_id ||
              campaign.campaignName ||
              campaign.campaignCode ||
              "unknown"
            })`,
            "debug"
          );
          ACC.length = totalCountExpected;
        }

        if (had401Token) return; // stop further processing for this campaign

        // Format and push accumulated rows
        const rowsWithCampaign = ACC.map((row) => ({ ...row, campaign }));
        const createdOnChild =
          typeof date === "string" ? date : date?.start_date;
        const formattedRows = fetchConf.format
          ? rowsWithCampaign.map((row) => fetchConf.format(row, createdOnChild))
          : rowsWithCampaign;

        if (fetchConf.outputKey) {
          if (!output[fetchConf.outputKey]) {
            output[fetchConf.outputKey] = [];
          }
          output[fetchConf.outputKey].push(...formattedRows);
          const campId =
            campaign.campaign_name ||
            campaign.campaign_id ||
            campaign.campaignName ||
            campaign.campaignCode ||
            "unknown";
          logger(
            `Added ${formattedRows.length} rows to ${
              fetchConf.outputKey
            } (campaign=${campId}) [type=${fetchConf.type}]${
              date ? ` [date=${fmtDate(date)}]` : ""
            }`,
            "debug"
          );
        }
      };

      if (options.sequential) {
        for (const fetchConf of fetches) {
          if (SEQ_FETCH_DELAY_MS > 0) {
            logger(
              `[SEQ] Sleeping ${SEQ_FETCH_DELAY_MS}ms before fetch type=${fetchConf.type}`,
              "debug"
            );
            await sleep(SEQ_FETCH_DELAY_MS);
          }
          await runFetchConf(fetchConf);
          if (had401Token) break;
        }
      } else {
        await withConcurrency(
          fetches,
          CAMPAIGN_CONCURRENCY_EFF > 0
            ? FETCH_CONCURRENCY_EFF
            : FETCH_CONCURRENCY,
          runFetchConf
        );
      }
    };

    // Determine start index for this adType if resuming
    // If resuming this adType, start from resumeIndex (retry same campaign)
    const startIdx =
      resumeAdType === adType && resumeIndex >= 0
        ? Math.max(0, Math.min(formattedCampaigns.length - 1, resumeIndex))
        : 0;

    if (options.sequential) {
      for (let i = startIdx; i < formattedCampaigns.length; i++) {
        const campaign = formattedCampaigns[i];
        await campaignWorker(campaign, i);
        if (SEQ_CAMPAIGN_DELAY_MS > 0 && i < formattedCampaigns.length - 1) {
          logger(
            `[SEQ] Sleeping ${SEQ_CAMPAIGN_DELAY_MS}ms before next campaign (${
              i + 2
            }/${formattedCampaigns.length})`,
            "debug"
          );
          await sleep(SEQ_CAMPAIGN_DELAY_MS);
        }
        if (had401Token) break;
      }
    } else {
      await withConcurrency(
        formattedCampaigns.slice(startIdx),
        CAMPAIGN_CONCURRENCY_EFF > 0
          ? CAMPAIGN_CONCURRENCY_EFF
          : CAMPAIGN_CONCURRENCY,
        async (campaign, index) => campaignWorker(campaign, index + startIdx)
      );
    }

    // If any 401 occurred during parallel fetches, short-circuit to preserve original behavior
    if (had401Token) {
      return {
        ...output,
        had401Token: true,
        error,
        success: false,
        // Prefer precise page-level resume if available
        resumeFrom: resumeFromHint || {
          adType: lastAdType,
          index: lastCampaignIndex,
        },
      };
    }
  }

  const summary = {
    campaigns: output.campaigns.length,
    products: output.products.length,
    categories: output.categories.length,
    keywords: output.keywords.length,
    slots: output.slots.length,
    success,
    had401Token,
  };

  logger(
    `Process completed for token ${cookieKey}. Summary: ${JSON.stringify(
      summary
    )}`,
    "info"
  );

  return {
    ...output,
    had401Token,
    error,
    success,
  };
}

async function handleTokenLoop(
  cookieArray,
  clientId,
  existingData,
  brandLookup,
  CONFIG,
  date = null,
  logger,
  options = {}
) {
  let cookies = cookieArray;
  let cookiesTried = 0;
  const successfulStores = new Set();
  const failedStores = new Set();
  const results = [];
  let lastError = null;
  let totalProcessed = 0;

  // Support resume across attempts for the same token
  let resumeFrom = null; // { adType, index }
  while (cookiesTried < MAX_TRIES) {
    let had401 = false;

    for (const tokenInfo of cookies) {
      const cookieKey = Object.keys(tokenInfo)[0];
      const cookieString = tokenInfo[cookieKey];

      if (successfulStores.has(cookieKey)) {
        logger(`Skipping already successful token: ${cookieKey}`, "debug");
        continue;
      }

      // If cookie is missing/empty, treat as expired and trigger refresh path
      if (!cookieString || String(cookieString).trim() === "") {
        logger(
          `Empty cookie for token ${cookieKey}; marking as 401 to trigger refresh`,
          "warn"
        );
        had401 = true;
        break; // stop processing tokens for this attempt; refresh cookies
      }

      logger(
        `Processing token: ${cookieKey} (Attempt ${
          cookiesTried + 1
        }/${MAX_TRIES})`,
        "info"
      );
      totalProcessed++;

      try {
        const {
          campaigns = [],
          products = [],
          categories = [],
          keywords = [],
          slots = [],
          had401Token = false,
          success = false,
          error = null,
          resumeFrom: returnedResumeFrom,
        } = await processSingleToken(
          cookieString,
          cookieKey,
          existingData,
          brandLookup,
          CONFIG,
          date,
          logger,
          { ...options, resumeFrom }
        );

        results.push({
          store: cookieKey,
          campaigns,
          products,
          categories,
          keywords,
          slots,
        });

        const attemptNo = cookiesTried + 1;
        if (success) {
          logger(
            `Token ${cookieKey} attempt ${attemptNo}: processed ${campaigns.length} campaigns (success)`,
            "info"
          );
          successfulStores.add(cookieKey);
          failedStores.delete(cookieKey);
          logger(`Successfully completed processing for ${cookieKey}`, "info");
          resumeFrom = null; // clear resume hint on success
        } else {
          failedStores.add(cookieKey);
          lastError = error;
          const errorMsg = error?.message || "Unknown error";
          logger(
            `Token ${cookieKey} attempt ${attemptNo}: partial/error after ${campaigns.length} campaigns -> ${errorMsg}`,
            "error"
          );
          results.push({
            store: cookieKey,
            error: errorMsg,
            timestamp: new Date().toISOString(),
            attempt: attemptNo,
          });
          // Keep resume hint from this attempt if provided by processSingleToken
          if (
            had401Token &&
            returnedResumeFrom &&
            typeof returnedResumeFrom === "object"
          ) {
            resumeFrom = returnedResumeFrom;
          }
        }

        if (had401Token) {
          had401 = true;
          // Capture resume hint from this call if provided
          if (returnedResumeFrom && typeof returnedResumeFrom === "object") {
            resumeFrom = returnedResumeFrom;
          }
          break;
        }
      } catch (err) {
        const errorMsg = err?.message || "Unknown internal error";
        logger(`Unexpected error in processing ${cookieKey}: ${err}`, "error");
        failedStores.add(cookieKey);
        results.push({
          store: cookieKey,
          error: errorMsg,
          timestamp: new Date().toISOString(),
          attempt: cookiesTried + 1,
        });
        lastError = err;
      }
    }

    if (had401) {
      console.log("had401", had401);
      cookiesTried++;
      if (cookiesTried < MAX_TRIES) {
        try {
          // Single-flight cookie refresh per clientId
          let refreshPromise = cookieRefreshInFlight.get(clientId);
          let isCreator = false;
          if (!refreshPromise) {
            isCreator = true;
            logger(`[401] Fetching fresh cookies from Lambda...`);
            refreshPromise = fetchTalabatCookies(clientId);
            cookieRefreshInFlight.set(clientId, refreshPromise);
          } else {
            logger(`[401] Awaiting in-flight cookie refresh...`);
          }
          cookies = await refreshPromise;
          if (isCreator) {
            // Clear the slot so future refreshes can proceed
            cookieRefreshInFlight.delete(clientId);
          }
        } catch (fetchErr) {
          logger(`[ERROR] Failed to fetch cookies: ${fetchErr.message}`);
          // Ensure we clear the in-flight on error if we are creator
          if (cookieRefreshInFlight.get(clientId)) {
            cookieRefreshInFlight.delete(clientId);
          }
          throw fetchErr;
        }
        continue;
      } else {
        logger(`[401] Cookie refresh failed. Aborting.`);
        throw lastError || new Error("Noon 401, even after retry.");
      }
    } else {
      break;
    }
  }

  return {
    results,
    totalProcessed,
    successfulStores: Array.from(successfulStores),
    failedStores: Array.from(failedStores),
    updatedCookies: cookies,
  };
}

async function getCampaignsDetails(
  cookieArray,
  brandLookup,
  clientId,
  existingData,
  CONFIG,
  date = null,
  logger,
  options = {}
) {
  if (!Array.isArray(cookieArray) || cookieArray.length === 0) {
    throw new Error("cookieArray must be a non-empty array");
  }

  if (!brandLookup || typeof brandLookup !== "object") {
    throw new Error("brandLookup must be an object");
  }

  const processStart = new Date().toISOString();
  logger(
    `Starting campaign details fetch process${date ? ` [date=${date}]` : ""}`,
    "info"
  );
  logger(`Start Time: ${processStart}`, "debug");
  logger(`Number of tokens to process: ${cookieArray.length}`, "debug");

  // Fetch campaign results from token loop
  const { results, ...output } = await handleTokenLoop(
    cookieArray,
    clientId,
    existingData,
    brandLookup,
    CONFIG,
    date,
    logger,
    options
  );

  const processEnd = new Date().toISOString();
  const duration = new Date(processEnd) - new Date(processStart);

  // Final summary logs
  logger(`\n=== Process Completed ===`, "info");
  logger(
    `Total Tokens Processed: ${output.totalProcessed}${
      date
        ? ` [date=${typeof date === "string" ? date : JSON.stringify(date)}]`
        : ""
    }`,
    "info"
  );
  logger(
    `Successful: ${output.successfulStores.length}${
      date
        ? ` [date=${typeof date === "string" ? date : JSON.stringify(date)}]`
        : ""
    }`,
    "info"
  );
  logger(
    `Failed: ${output.failedStores.length}${
      date
        ? ` [date=${typeof date === "string" ? date : JSON.stringify(date)}]`
        : ""
    }`,
    output.failedStores.length > 0 ? "warn" : "info"
  );
  logger(
    `Total Campaigns Fetched: ${results.reduce(
      (sum, r) => sum + (r.campaigns?.length || 0),
      0
    )}${
      date
        ? ` [date=${typeof date === "string" ? date : JSON.stringify(date)}]`
        : ""
    }`,
    "info"
  );
  logger(
    `Duration: ${(duration / 1000).toFixed(2)} seconds${
      date
        ? ` [date=${typeof date === "string" ? date : JSON.stringify(date)}]`
        : ""
    }`,
    "info"
  );
  logger(
    `End Time: ${processEnd}${
      date
        ? ` [date=${typeof date === "string" ? date : JSON.stringify(date)}]`
        : ""
    }`,
    "debug"
  );

  if (output.failedStores.length > 0) {
    logger(`Failed tokens: ${output.failedStores.join(", ")}`, "warn");
  }

  return {
    results, // [{ store, campaigns, products, keywords, sub-category ,sources}]
    ...output,
  };
}

module.exports = {
  getCampaignsDetails,
  isSlowMode,
};
