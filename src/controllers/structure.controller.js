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

    // !------------------------------------------------
    let campaignArray = [];
    await campaign_details?.results[0]?.campaigns?.map((campaign) => {
      campaignArray.push(campaign.campaign_id);
    });
    if (campaignArray.length > 0) {
      logger("Fetching custom data for each campaign...");

      // ! remove this line
      // campaignArray = campaign_details?.results?.[0]?.campaigns?.slice(0, 2);

      // Make a separate API call for each campaign ID to ensure all are processed.
      const customDataPromises = campaignArray.map((campaignId) => {
        const singleCampaignConfig = [
          {
            "Custom Data": [
              {
                subUrl: `campaigns/${campaignId}`,
                method: "GET",
                getPayload: () => ({}),
                model: "talabat_campaigns",
                dataExtractor: (data) => (data ? [data] : []),
                // Corrected: Merge the ID directly into the response object, no extra nesting.
                format: (row) => ({ ...row, fetched_campaign_id: campaignId }),
              },
            ],
          },
        ];

        return getCampaignsDetails(
          cookieString,
          brandLookup,
          clientId,
          existingData,
          singleCampaignConfig,
          { start_date, end_date },
          logger,
          {
            baseUrl: talabatClient.baseUrl,
            entityCode: talabatClient.entityCode,
          }
        );
      });

      // Wait for all API calls to complete
      const allCustomDataResults = await Promise.all(customDataPromises);
      // console.log(
      //   allCustomDataResults,
      //   "<<<<<<<<<<<<<<<<<<<<<<<<<< customDataPromises"
      // );
      // --- Data Merging Logic ---
      const campaignDetailsMap = new Map();
      // 1. Build a comprehensive lookup map from the detailed campaign data
      const detailedCampaigns = allCustomDataResults
        .flatMap((result) => result.results.flatMap((r) => r.campaigns || []))
        .filter((detail) => detail.data);

      for (const detail of detailedCampaigns) {
        const campaignData = detail.data;
        if (campaignData && campaignData.id) {
          const customBidsMap = new Map();
          if (campaignData.pricing?.custom_bids) {
            for (const customBid of campaignData.pricing.custom_bids) {
              if (customBid.search_keyword) {
                customBidsMap.set(customBid.search_keyword, customBid.bid);
              }
            }
          }

          campaignDetailsMap.set(campaignData.id, {
            default_bid: campaignData.pricing?.default_bid,
            daily_budget: campaignData.pricing?.budget?.daily || null,
            custom_bids: customBidsMap,
          });
        }
      }

      // 2. Enrich the original campaigns list
      const originalCampaigns = campaign_details?.results?.[0]?.campaigns || [];
      const mergedCampaigns = originalCampaigns.map((campaign) => {
        const extraData = campaignDetailsMap.get(campaign.campaign_id);
        if (extraData) {
          return {
            ...campaign,
            cpm_bid: extraData.default_bid,
            daily_budget: extraData.daily_budget,
          };
        }

        console.log(campaign, "<<<<<<< CAMPAIGN");
        return campaign;
      });
      return;

      console.log(mergedCampaigns, "<<<<<<< mergedCampaigns");
      // 3. Enrich the original keywords list
      const originalKeywords = campaign_details?.results?.[0]?.keywords || [];
      const mergedKeywords = originalKeywords.map((keyword) => {
        const campaignBids = campaignDetailsMap.get(keyword?.campaign_id);
        console.log(campaignBids, "<<<<<<< campaign Bids");
        if (!campaignBids || !campaignBids.slots) {
          return keyword; // Return the original keyword if no campaign bids or slots exist
        }

        console.log(campaignBids, "<---------campaignBids");
        const slot = campaignBids.slots.get(keyword.keyword);
        const customBid = campaignBids.custom_bids?.get(keyword.keyword);
        const bidToApply = customBid || null;

        return {
          ...keyword,
          bid: bidToApply,
        };
        return keyword;
      });

      // 4. Replace the original data with the newly enriched data
      if (campaign_details?.results?.[0]) {
        campaign_details.results[0].campaigns = mergedCampaigns;
        campaign_details.results[0].keywords = mergedKeywords;
      }
      // --- End of Data Merging Logic ---
    }

    return;
    if (campaign_details) {
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
        for (const { model, key, deleteWhere } of entityInsertMap) {
          const rows = flattenByKey(campaign_details.results, key);
          logger(`Inserting ${rows.length} rows into ${model}...`);

          // Build conditional delete for products/keywords where status is 'active' or NULL, scoped to relevant account_ids
          let conditionalWhere = undefined;
          if (rows.length > 0) {
            if (typeof deleteWhere === "function") {
              try {
                conditionalWhere = deleteWhere({ rows, db: pgClientDb });
                if (conditionalWhere) {
                  logger(`[CONFIG] Using deleteWhere for ${model}`);
                }
              } catch (e) {
                logger(`[CONFIG][deleteWhere][ERROR] ${e.message}`);
              }
            }

            // Fallback logic if no deleteWhere provided in config
            if (
              !conditionalWhere &&
              (model === "talabat_products" || model === "talabat_keywords")
            ) {
              const accountIds = Array.from(
                new Set(rows.map((r) => r.account_id).filter(Boolean))
              );
              if (accountIds.length > 0) {
                conditionalWhere = {
                  [pgClientDb.Op.and]: [
                    { account_id: { [pgClientDb.Op.in]: accountIds } },
                    {
                      [pgClientDb.Op.or]: [
                        { status: "active" },
                        { status: null },
                      ],
                    },
                  ],
                };
                logger(
                  `Applying conditional delete on ${model} for ${accountIds.length} account(s) where status in ('active', NULL)`
                );
              }
            }
          }

          if (rows.length > 0) {
            await insertDataWithDeletion({
              db: pgClientDb,
              modelName: model,
              rows,
              transaction,
              where: conditionalWhere,
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
    }
  } catch (error) {
    logger(`ERROR: ${error.stack || error.message}`, "error");
    console.error("Error fetching campaign details:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
