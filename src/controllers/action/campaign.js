const { getApiUrl, actionApiCall } = require("../../services/actionApi");
const { ACTION_CONFIG } = require("../../constants");
const { fetchTalabatTokenArray } = require("../../utils/getCookies");
const { getConnectedDatabases } = require("../../db/connect");
const {
  fetchCampaignDetails,
  checkNameExists,
  preparePayloadInput,
} = require("../../services/action/campaign/config_api");
const { requestWithCookieRenewal } = require("../../utils/requestHandler");

const campaignController = {
  editCampaign: async (req, res) => {
    try {
      // Extract required fields from request
      const { campaigns, platformId } = req.body;
      const clientId = req.body.clientId || req.query.clientId;

      // Validate clientId presence
      if (!clientId) {
        throw new Error("Missing required clientId in request");
      }

      // Validate campaigns array
      if (!Array.isArray(campaigns) || campaigns.length === 0) {
        throw new Error("Campaign actions must be a non-empty array");
      }

      const actionConfig = ACTION_CONFIG;

      // Connect to DB
      const { commonDB: pgCommonDB } = await getConnectedDatabases(clientId);
      if (!pgCommonDB) {
        throw new Error("Common DB connection not available");
      }
      // Fetch authentication tokens for Talabat API
      let cookiesArray = await fetchTalabatTokenArray({
        clientId,
        platformId,
        commonDB: pgCommonDB,
      });

      // Map tokens by store
      const tokenMap = cookiesArray.reduce((acc, item) => {
        const [store, cookie] = Object.entries(item)[0];
        acc[store.toLowerCase()] = cookie;
        return acc;
      }, {});

      const results = [];

      // Process each campaign action
      for (const campaign of campaigns) {
        try {
          const { campaign_id, action, value, campaign_type, account_id } =
            campaign;
          const typeKey = (campaign_type || "").toLowerCase().trim();
          const storeKey = (account_id || "").toLowerCase().trim();

          const allowedForType =
            ACTION_CONFIG.allowedActions[typeKey]?.campaign || [];
          if (!allowedForType.includes(action)) {
            throw new Error(
              `Action '${action}' is not allowed for campaign type '${typeKey}'`
            );
          }
          const typeUrl = actionConfig.typeSuffixUrl[typeKey]?.["campaign"];
          // console.log("typeUrl:", typeUrl);
          
          // Replace :campaign_id placeholder in URL if present
          let actionUrlSuffix = typeUrl?.[action]?.url || "";
          actionUrlSuffix = actionUrlSuffix.replace(":campaign_id", campaign_id);
          
          const action_url = getApiUrl(actionUrlSuffix, clientId);
          const details_url = getApiUrl(typeUrl?.campaign_details, clientId);
          const negative_list_url = getApiUrl(typeUrl?.negative_keyword_list, clientId);

          const payloadFn =
            actionConfig.payloadTemplates[typeKey]?.["campaign"]?.[action];

          if (!typeUrl || !payloadFn) {
            throw new Error(
              `Unsupported action: ${campaign_type}/campaign/${action}`
            );
          }

          // Step 1: Pre-fetch campaign details (optional)
          let campaignDetails = {};
          
          // Actions that require GET campaign details first
          const requiresGetDetails = ["update_name", "budget", "change_date","daily_budget","cpm_bid","day_parting"];
          
          if (requiresGetDetails.includes(action)) {
            // Fetch full campaign details using GET
            const getDetailsUrl = typeUrl?.campaign_details?.url?.replace(":campaign_id", campaign_id);
            const fullDetailsUrl = getApiUrl(getDetailsUrl, clientId);
            
            campaignDetails = await requestWithCookieRenewal(
              fetchCampaignDetails,
              [fullDetailsUrl, campaign_id, "GET"], // Pass method as third argument
              { tokenMap, storeKey, clientId }
            );
          } 

          // Step 2: Prepare input for payload
          const inputData = preparePayloadInput(
            action,
            campaign_id,
            value,
            campaignDetails,
            campaign
          );

          // Step 3: Optional: Pre-check name duplication
          if (typeUrl?.[action].preCheckUrl && inputData.campaignName) {
            const nameExists = await requestWithCookieRenewal(
              checkNameExists,
              [typeUrl?.[action].preCheckUrl, inputData.campaignName],
              { tokenMap, storeKey, clientId }
            );
            if (nameExists) {
              throw new Error(
                `Campaign name '${inputData.campaignName}' already exists.`
              );
            }
          }

          // Step 4: Generate payload
          const payload = payloadFn?.buildPayload(inputData);
          // console.log("payload:,", payload);
          
          // Step 5: Call API
          const httpMethod = typeUrl?.[action]?.method || "POST";
          await actionApiCall(action_url, payload, {
            storeKey,
            tokenMap,
            clientId,
            method: httpMethod,
          });

          // Handle success message
          results.push({
            campaign_id,
            success: true,
            message: payloadFn?.message
              ? payloadFn.message({
                  ...inputData,
                  campaign_id,
                })
              : `Action "${action}" completed for campaign ID ${campaign_id}`,
            action,
            value,
          });
        } catch (err) {
          // Catch per-campaign errors and continue processing others
          console.error(
            `Error processing campaign ID ${campaign.campaign_id}:`,
            err
          );

          results.push({
            campaign_id: campaign.campaign_id,
            success: false,
            message: getErrorMessage({
              action: campaign.action,
              campaign_id: campaign.campaign_id,
              campaign_type: campaign.campaign_type,
              account_id: campaign.account_id,
              value: campaign.value,
              error: err,
            }),
            action: campaign.action,
          });
        }
      }

      // Respond with aggregated results
      res.json({
        success: true,
        message: "Bulk campaign actions completed",
        data: results,
      });
    } catch (error) {
      console.error("Error in editCampaign controller:", error);
      res.status(500).json({
        success: false,
        message: "Error performing bulk campaign actions",
        error: error.message,
      });
    }
  },
};

// === Helper functions ===
function getErrorMessage({
  action,
  campaign_id,
  campaign_type,
  account_id,
  value,
  error,
}) {
  const actionTypesWithoutValue = ["resume", "pause", "stop", "delete"];

  const valStr = actionTypesWithoutValue.includes(action)
    ? action
    : Array.isArray(value)
    ? value.join(", ")
    : JSON.stringify(value);

  // Extract the best error message
  let errorMessage = "Unknown error";

  if (error?.response?.data?.msg) {
    errorMessage = error.response.data.msg;
  } else if (error?.message) {
    errorMessage = error.message;
  } else if (typeof error === "string") {
    errorMessage = error;
  } else {
    errorMessage = JSON.stringify(error);
  }

  return `❌ Action "${action}" failed for campaign ID "${campaign_id}" (${
    campaign_type || "unknown"
  } campaign, account: ${
    account_id || "N/A"
  }).\nProvided value: ${valStr}.\nError: ${errorMessage}`;
}

module.exports = campaignController;
