const { getApiUrl, actionApiCall } = require("../../services/actionApi");
const { fetchTalabatTokenArray } = require("../../utils/getCookies");
const { getConnectedDatabases } = require("../../db/connect");
const { ACTION_CONFIG } = require("../../constants");
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
      let { keywords, platformId } = req.body;
      const items = keywords;

      if (!clientId) throw new Error("Missing required clientId in request");
      if (!Array.isArray(items) || items.length === 0) {
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

      for (const item of items) {
        try {
          const {
            campaign_id,
            campaign_name,
            account_id,
            action,
            campaign_type,
            targetType,
            bid,
            targetValue,
          } = item || {};

          if (!campaign_id || !action) {
            throw new Error("Each item must include campaign_id and action");
          }

          const typeKey = (campaign_type || "product ad").toLowerCase().trim();
          let storeKey = (account_id || "").toLowerCase().trim();
          const actionKey = String(action).toLowerCase().trim();

          const allowedForType =
            actionConfig.allowedActions[typeKey]?.keyword || [];
          if (!allowedForType.includes(actionKey)) {
            throw new Error(
              `Action '${actionKey}' is not allowed for keyword type '${typeKey}'`
            );
          }

          const typeUrl = actionConfig.typeSuffixUrl[typeKey]?.["keyword"];
          const action_url = getApiUrl(typeUrl?.[actionKey]?.url);
          const payloadFn =
            actionConfig.payloadTemplates[typeKey]?.["keyword"]?.[actionKey];
          if (!typeUrl || !payloadFn || !action_url) {
            throw new Error(
              `Unsupported action: ${typeKey}/keyword/${actionKey}`
            );
          }

          const inputData = {
            campaignCode: campaign_id,
            targetType,
            targetValue: targetValue || campaign_name,
            bid,
          };
          const payload = payloadFn.buildPayload(inputData);

          const response = await actionApiCall(action_url, payload, {
            storeKey,
            tokenMap,
            clientId,
          });

          results.push({
            campaign_id,
            targetType: inputData.targetType,
            targetValue: inputData.targetValue,
            success: true,
            message: payloadFn?.message
              ? payloadFn.message({ ...inputData })
              : `Action "${actionKey}" completed for target "${inputData.targetValue}" in campaign ${campaign_id}`,
            action: actionKey,
            data: response,
          });
        } catch (err) {
          results.push({
            campaign_id: item?.campaign_id,
            targetType: item?.targetType,
            targetValue: item?.targetValue || item?.campaign_name,
            success: false,
            message: getErrorMessage({
              action: String(item?.action || "").toLowerCase(),
              campaignCode: item?.campaign_id,
              targetType: item?.targetType,
              targetValue: item?.targetValue || item?.campaign_name,
              error: err,
            }),
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
function getSuccessMessage({ keyword, type, details }) {
  switch (type) {
    case "add":
      return `Successfully added keyword "${keyword}" with bid_price: ${
        (details?.add?.bid_price || 0) / 100000
      }, match_type: ${details?.add?.match_type}`;
    case "delete":
      return `Successfully deleted keyword "${keyword}"`;
    case "change_bid_price":
      return `Successfully changed bid price of keyword "${keyword}" to ${
        (details?.change_bid_price?.price || 0) / 100000
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
      reason = ` | Provided: bid_price=${
        (details?.add?.bid_price || 0) / 100000
      }, match_type=${details?.add?.match_type}`;
      break;
    case "change_bid_price":
      reason = ` | Target bid price: ${
        (details?.change_bid_price?.price || 0) / 100000
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
