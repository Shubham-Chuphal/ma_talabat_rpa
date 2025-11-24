const { getApiUrl, actionApiCall } = require("../../services/actionApi");
const { fetchTalabatTokenArray } = require("../../utils/getCookies");
const { getConnectedDatabases } = require("../../db/connect");
const { ACTION_CONFIG } = require("../../constants");
const { fetchCampaignDetails, prepareKeywordPayloadInput } = require("../../services/action/campaign/config_api");
const { requestWithCookieRenewal } = require("../../utils/requestHandler");
// const {
//   payload: shopAdPayload,
// } = require("../../services/action/keyword/shopAdActionPayload");
// const {
//   payload: productAdPayload,
// } = require("../../services/action/keyword/productAdActionPayload");

const keywordController = {
  editKeyword: async (req, res) => {
  try {
    const clientId = req.body.clientId || req.query.clientId;
    const { keywords, platformId } = req.body;

    if (!clientId) throw new Error("Missing required clientId in request");
    if (!Array.isArray(keywords) || keywords.length === 0) {
      throw new Error("keywords must be a non-empty array");
    }

    const actionConfig = ACTION_CONFIG;
    const { commonDB: pgCommonDB } = await getConnectedDatabases(clientId);
    if (!pgCommonDB) throw new Error("Common DB connection not available");

    const cookiesArray = await fetchTalabatTokenArray({
      clientId,
      platformId,
      commonDB: pgCommonDB,
    });

    const tokenMap = cookiesArray.reduce((acc, item) => {
      const [store, cookie] = Object.entries(item)[0];
      acc[store.toLowerCase()] = cookie;
      return acc;
    }, {});

    const results = [];

    for (const item of keywords) {
      try {
        const {
          campaign_id,
          campaign_name,
          account_id,
          action,
          campaign_type,
          targetType,
          bid,
          targetValue, // ✅ always single keyword now
        } = item || {};

        if (!campaign_id || !action) {
          throw new Error("Each item must include campaign_id and action");
        }

        const typeKey = (campaign_type || "product ad").toLowerCase().trim();
        const storeKey = (account_id || "").toLowerCase().trim();
        const actionKey = String(action).toLowerCase().trim();

        const allowedForType =
          actionConfig.allowedActions[typeKey]?.keyword || [];
        if (!allowedForType.includes(actionKey)) {
          throw new Error(
            `Action '${actionKey}' is not allowed for keyword type '${typeKey}'`
          );
        }

        const typeUrl = actionConfig.typeSuffixUrl[typeKey]?.keyword;
        const campaignTypeUrl = actionConfig.typeSuffixUrl[typeKey]?.campaign;

        let actionUrlSuffix = typeUrl?.[actionKey]?.url || "";
        actionUrlSuffix = actionUrlSuffix.replace(":campaign_id", campaign_id);

        const action_url = getApiUrl(actionUrlSuffix, clientId);
        const payloadFn =
          actionConfig.payloadTemplates[typeKey]?.keyword?.[actionKey];

        if (!typeUrl || !payloadFn) {
          throw new Error(
            `Unsupported action: ${typeKey}/keyword/${actionKey}`
          );
        }

        // ✅ Step 1: Fetch campaign details
        const detailsUrl = campaignTypeUrl?.campaign_details?.url?.replace(
          ":campaign_id",
          campaign_id
        );
        const fullDetailsUrl = getApiUrl(detailsUrl, clientId);

        const campaignDetails = await requestWithCookieRenewal(
          fetchCampaignDetails,
          [fullDetailsUrl, campaign_id, "GET"],
          { tokenMap, storeKey, clientId }
        );

        // ✅ Validate single keyword
        if(actionKey !== "bid"){
          validateKeywordOperation(campaignDetails, targetValue, actionKey);
        }

        // ✅ Step 2: Build payload
        const inputData = prepareKeywordPayloadInput(
          actionKey,
          campaign_id,
          targetValue,
          bid,
          campaignDetails,
          targetType
        );

        const payload = payloadFn.buildPayload(inputData);

        // ✅ Step 3: Execute API
        const httpMethod = typeUrl?.[actionKey]?.method || "PUT";
        const response = await actionApiCall(action_url, payload, {
          storeKey,
          tokenMap,
          clientId,
          method: httpMethod,
        });

        const returnedKeywords =
          response?.data?.promotion?.search?.keywords || [];

        // ✅ Evaluate success
        const exists = returnedKeywords.includes(targetValue);
        const success =
          actionKey === "disable" ? !exists : exists;

        const message =
          actionKey === "disable"
            ? success
              ? `Keyword "${targetValue}" disabled successfully`
              : `Keyword "${targetValue}" still present after disable`
            : success
              ? `Keyword "${targetValue}" ${actionKey} completed successfully`
              : `Keyword "${targetValue}" ${actionKey} failed`;

        results.push({
          campaign_id,
          campaign_name: response.data.name,
          account_id,
          campaign_type,
          keywords: [
            {
              keyword: targetValue,
              type: actionKey,
              success,
              message,
            },
          ],
        });
      } catch (err) {
        results.push({
          campaign_id: item?.campaign_id,
          targetValue: item?.targetValue,
          success: false,
          message: `Error: ${err.response.data.message}`,
          status:err.status
        });
      }
    }

    res.json({
      success: true,
      message: "keyword actions completed",
      data: results,
    });
  } catch (error) {
    console.error("Error in editKeyword:", error);
    res.status(500).json({
      success: false,
      message: "Error performing keyword operations",
      error: error.message,
    });
  }
},
};

// Message helpers
function validateKeywordOperation(campaignDetails, keyword, action) {
  const list =
    campaignDetails?.data?.promotion?.search?.keywords || [];

  const normalizedList = list.map(k => k.trim().toLowerCase());
  const normalized = keyword?.trim()?.toLowerCase();

  const exists = normalizedList.includes(normalized);

  if (action === "enable" && exists) {
    throw new Error(`Keyword already exists: ${keyword}`);
  }
  if (action === "disable" && !exists) {
    throw new Error(`Keyword does not exist: ${keyword}`);
  }

  return true;
}



function getSuccessMessage({ keyword, type, details }) {
  switch (type) {
    case "add":
      return `Successfully added keyword "${keyword}" with bid_price: ${(details?.add?.bid_price || 0) / 100000
        }, match_type: ${details?.add?.match_type}`;
    case "delete":
      return `Successfully deleted keyword "${keyword}"`;
    case "change_bid_price":
      return `Successfully changed bid price of keyword "${keyword}" to ${(details?.change_bid_price?.price || 0) / 100000
        }`;
    case "change_match_type":
      return `Successfully changed match type of keyword "${keyword}" to ${details?.change_match_type?.match_type}`;
    default:
      return `Successfully processed "${type}" for keyword "${keyword}"`;
  }
}

function getErrorMessage({ keyword, type, details, error }) {
  let reason = "";
  switch (type) {
    case "add":
      reason = ` | Provided: bid_price=${(details?.add?.bid_price || 0) / 100000
        }, match_type=${details?.add?.match_type}`;
      break;
    case "change_bid_price":
      reason = ` | Target bid price: ${(details?.change_bid_price?.price || 0) / 100000
        }`;
      break;
    case "change_match_type":
      reason = ` | Target match_type: ${details?.change_match_type?.match_type}`;
      break;
    case "delete":
      break;
    default:
      reason = ` | Details: ${JSON.stringify(details)}`;
  }
  return `Error: ${error?.message || error}`;
}

module.exports = keywordController;
