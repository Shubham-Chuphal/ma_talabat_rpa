const { getCampaignsDetails } = require("../services/pollExportData");
const { getEntityInsertMapFromConfig } = require("../services");
const {
  getBrandsByClientId,
  insertDataWithDeletion,
  getTalabatCampaigns,
} = require("../services/dbOperation");
const { getConnectedDatabases } = require("../db/connect");

const { STRUCTURE_CONFIG } = require("../constants");

const { writeDebugLog, createLogger } = require("../utils/debugLog");
const { fetchTalabatTokenArray } = require("../utils/getCookies");

// Controller for Talabat campaign structure (campaign details)
exports.campaignStructure = async (req, res) => {
  const logger = createLogger("debug_campaign_details.txt");

  logger("Starting campaign structure refresh, clearing log file...", "info");
  writeDebugLog("", "debug_campaign_details.txt", "w"); // Keep this to clear file at start

  try {
    const clientId = req.query.clientId || req.body.clientId;
    const { start_date, end_date } = req.body;
    if (!clientId) {
      logger("Missing required params: clientId", "error");
      return res
        .status(400)
        .json({ success: false, message: "Missing required params" });
    }

    const {
      commonDB: pgCommonDB,
      postgres: pgClientDb,
      dbName,
    } = await getConnectedDatabases(clientId);
    if (!pgCommonDB) {
      throw new Error("Common DB connection not available");
    }

    const brands = await getBrandsByClientId(clientId, pgCommonDB);
    let brandLookup = {};
    brands.forEach(({ brand_id, brand_name }) => {
      brandLookup[brand_id] = brand_name;
    });

    const platformId = "10";
    let cookieString = await fetchTalabatTokenArray({
      clientId,
      platformId,
      commonDB: pgCommonDB,
    });
    console.log("cookieString:", cookieString);
    // return;
    const campaigns = await getTalabatCampaigns(
      pgClientDb,
      {
        pin: { [pgClientDb.Op.ne]: null },
      },
      {
        attributes: ["campaign_id", "pin"],
      }
    );

    const existingData = campaigns.reduce((acc, campaign) => {
      acc[campaign.campaign_id] = campaign.pin;
      return acc;
    }, {});

    const processStart = new Date().toISOString();
    logger(
      `Start campaign structure refresh | Process Start Time: ${processStart} | db=${dbName} | clientId=${clientId}`
    );

    const talabatClient = req.talabatClient || {};
    console.log("talabatClient:", talabatClient);
    const campaign_details = await getCampaignsDetails(
      cookieString,
      brandLookup,
      clientId,
      existingData,
      STRUCTURE_CONFIG,
      { start_date, end_date },
      logger,
      { baseUrl: talabatClient.baseUrl, entityCode: talabatClient.entityCode }
    );

    const entityInsertMap = getEntityInsertMapFromConfig(STRUCTURE_CONFIG);

    function flattenByKey(details, key) {
      if (!details) {
        logger(
          `flattenByKey: Input details is null or undefined for key: ${key}`,
          "warn"
        );
        return [];
      }

      const detailsArray = Array.isArray(details) ? details : [details];

      return detailsArray.flatMap((storeResult, index) => {
        if (!storeResult || typeof storeResult !== "object") {
          logger(
            `flattenByKey: Invalid storeResult at index ${index} for key: ${key}`,
            "warn"
          );
          return [];
        }

        const items = storeResult[key];
        if (!items) {
          logger(
            `flattenByKey: Key '${key}' not found in storeResult at index ${index}`,
            "warn"
          );
          return [];
        }

        const result = Array.isArray(items)
          ? items.map((item) => ({ ...item, store: storeResult.store }))
          : [];

        if (result.length === 0) {
          logger(
            `flattenByKey: No items found or not an array for key '${key}' at index ${index}`,
            "warn"
          );
        }

        return result;
      });
    }

    await pgClientDb.transaction(async (transaction) => {
      for (const { model, key } of entityInsertMap) {
        const rows = flattenByKey(campaign_details.results, key);
        logger(`Inserting ${rows.length} rows into ${model}...`);
        if (rows.length > 0) {
          await insertDataWithDeletion({
            db: pgClientDb,
            modelName: model,
            rows,
            transaction,
            logger,
          });
        } else {
          logger(`No rows to insert for ${model}.`);
        }
      }
      logger(`DB operation complete for all entities.`);
    });

    const processEnd = new Date().toISOString();
    logger(
      `Campaign structure refresh complete | Process End Time: ${processEnd}`
    );

    res.status(200).json({
      success: true,
      message: "Campaign data refreshed",
    });
  } catch (error) {
    logger(`ERROR: ${error.stack || error.message}`, "error");
    console.error("Error fetching campaign details:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
