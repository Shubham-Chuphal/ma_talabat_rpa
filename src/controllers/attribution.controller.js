const { getConnectedDatabases } = require("../db/connect");
const { getDateRangeArray } = require("../services");
const { getCampaignsDetails } = require("../services/pollExportData");
const { getTalabatBaseUrlForClient } = require("../config");
const {
  convertRowsToCsv,
  uploadCsvToS3,
} = require("../services/download&UploadS3");
const { writeDebugLog, createLogger } = require("../utils/debugLog");
const { getEntityInsertMapFromConfig } = require("../services");
const {
  getBrandsByClientId,
  insertDataWithDeletion,
} = require("../services/dbOperation");
const { fetchTalabatTokenArray } = require("../utils/getCookies");
const { ATTRIBUTION_CONFIG } = require("../constants");

exports.populateAttribution = async (req, res) => {
  const logger = createLogger("debug_attribution.txt");

  logger("Starting campaign structure refresh, clearing log file...", "info");
  writeDebugLog("", "debug_attribution.txt", "w");
  const clientId = req.query.clientId || req.body.clientId;
  const { start_date, end_date } = req.body;
  const platformId = "10";
  if (!start_date || !end_date || !clientId) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required params" });
  }
  try {
    const dateRangeArr = getDateRangeArray(start_date, end_date);
    const {
      commonDB: pgCommonDB,
      postgres: pgClientDb,
      dbName,
    } = await getConnectedDatabases(clientId);

    if (!pgCommonDB) {
      throw new Error("Common DB connection not available");
    }

    const processStart = new Date().toISOString();
    logger(
      `[Talabat][Attribution] Start Attribution refresh\nProcess Start Time: ${processStart}\nParams: db=${dbName}, clientId=${clientId}, start_date=${start_date}, end_date=${end_date}`
    );

    const brands = await getBrandsByClientId(clientId, pgCommonDB);
    const brandLookup = {};
    brands.forEach(({ brand_id, brand_name }) => {
      brandLookup[brand_id] = brand_name;
    });

    // console.log("campaignLookup:", campaignLookup);
    // return;

    let cookieString = await fetchTalabatTokenArray({
      clientId,
      platformId,
      commonDB: pgCommonDB,
    });

    logger(`[DEBUG] Running for stores length: ${cookieString.length}`);

    const attributionResults = [];

    // Resolve Talabat API base URL and entity code for this client
    const { baseUrl, entityCode } = getTalabatBaseUrlForClient(clientId);

    for (const date of dateRangeArr) {
      logger(`[Talabat][Attribution] Processing date: ${date}`);
      const dateRange = { start_date: date, end_date: date };
      const attributions = await getCampaignsDetails(
        cookieString,
        brandLookup,
        clientId,
        [],
        ATTRIBUTION_CONFIG,
        dateRange,
        logger,
        { baseUrl, entityCode }
      );
      logger(
        `[Talabat][Attribution] Completed fetching for date: ${date}, Total Stores Processed: ${
          attributions?.results?.length || 0
        }`
      );
      if (attributions?.results?.length > 0) {
        // Add `date` to each result (each storeResult in results array)
        const datedResults = attributions.results.map((storeResult) => ({
          ...storeResult,
          date: date, // attach date to each store result
        }));
        attributionResults.push(...datedResults);

        logger(
          `[Talabat][Attribution] Merged results for date: ${date}, Total Accumulated: ${attributionResults.length}`
        );
      } else {
        logger(`[Talabat][Attribution] No results found for date: ${date}`);
      }
    }

    const mergedAttributions = { results: attributionResults };

    const entityInsertMap = getEntityInsertMapFromConfig(ATTRIBUTION_CONFIG);
    logger(
      `[Talabat][Attribution] Entity Insert Map: ${JSON.stringify(
        entityInsertMap
      )}`
    );

    function flattenByKey(details, key) {
      if (!details) return [];

      const detailsArray = Array.isArray(details) ? details : [details];

      return detailsArray.flatMap((storeResult) => {
        const items = storeResult[key];
        if (!Array.isArray(items)) return [];
        return items;
      });
    }

    await pgClientDb.transaction(async (transaction) => {
      for (const { model, key } of entityInsertMap) {
        const rows = flattenByKey(mergedAttributions.results, key);

        logger(
          `[Talabat][Attribution] Preparing ${rows.length} rows for model: ${model}`
        );

        if (rows.length > 0) {
          // Convert to CSV
          const csvContent = convertRowsToCsv(rows);

          // Upload to S3 first
          await uploadCsvToS3(csvContent, dbName, model);

          logger(
            `[Talabat][Attribution] Uploaded CSV to S3 for model: ${model}`
          );

          // Insert into DB after upload success
          await insertDataWithDeletion({
            db: pgClientDb,
            modelName: model,
            rows,
            transaction,
            where: {
              created_on: {
                [pgClientDb.Op.gte]: start_date,
                [pgClientDb.Op.lte]: end_date,
              },
            },
            logger,
          });

          logger(
            `[Talabat][Attribution] Inserted ${rows.length} rows into DB for model: ${model}`
          );
        } else {
          logger(`[Talabat][Attribution] No data found for model: ${model}`);
        }
      }
    });

    // Process and upload CSV files

    const processEnd = new Date().toISOString();
    logger(
      `[Talabat][Attribution] End Attribution refresh\nProcess End Time: ${processEnd}\nParams: db=${dbName}, clientId=${clientId}, start_date=${start_date}, end_date=${end_date}`,
      "debug_attribution.txt"
    );

    res.status(201).json({
      success: true,
      message: "Attributions populated successfully",
    });
  } catch (error) {
    console.error("Error populating attribution:", error);
    logger(`[ERROR] ${error.message}\n${error.stack}`, "debug_attribution.txt");
    res.status(500).json({
      success: false,
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};
