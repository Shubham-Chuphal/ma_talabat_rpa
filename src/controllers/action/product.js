const { getApiUrl, actionApiCall } = require("../../services/actionApi");
const { fetchTalabatTokenArray } = require("../../utils/getCookies");
const { getConnectedDatabases } = require("../../db/connect");
const { ACTION_CONFIG } = require("../../constants");
const { fetchCampaignDetails, prepareProductPayloadInput } = require("../../services/action/campaign/config_api");
const { requestWithCookieRenewal } = require("../../utils/requestHandler");

const productController = {
  editProduct: async (req, res) => {
    try {
      const clientId = req.body.clientId || req.query.clientId;
      let { products, platformId } = req.body;
      const items = products;

      if (!clientId) throw new Error("Missing required clientId in request");
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error("products must be a non-empty array");
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
            product_search_term,
            account_id,
            action,
            campaign_type,
            entity = "TB_AE",
          } = item || {};

          if (!campaign_id || !action) {
            throw new Error("Each item must include campaign_id and action");
          }

          if (!product_search_term) {
            throw new Error("product_search_term is required for product actions");
          }

          const typeKey = (campaign_type || "product ad").toLowerCase().trim();
          let storeKey = (account_id || "").toLowerCase().trim();
          const actionKey = String(action).toLowerCase().trim();

          const allowedForType =
            actionConfig.allowedActions[typeKey]?.product || [];
          if (!allowedForType.includes(actionKey)) {
            throw new Error(
              `Action '${actionKey}' is not allowed for product type '${typeKey}'`
            );
          }

          const typeUrl = actionConfig.typeSuffixUrl[typeKey]?.["product"];
          const campaignTypeUrl = actionConfig.typeSuffixUrl[typeKey]?.["campaign"];
          
          // Replace :campaign_id placeholder in URL
          let actionUrlSuffix = typeUrl?.[actionKey]?.url || "";
          actionUrlSuffix = actionUrlSuffix.replace(":campaign_id", campaign_id);
          
          const action_url = getApiUrl(actionUrlSuffix, clientId);
          const payloadFn =
            actionConfig.payloadTemplates[typeKey]?.["product"]?.[actionKey];
          if (!typeUrl || !payloadFn) {
            throw new Error(
              `Unsupported action: ${typeKey}/product/${actionKey}`
            );
          }

          // Step 1: Fetch campaign details using GET
          const getDetailsUrl = campaignTypeUrl?.campaign_details?.url?.replace(":campaign_id", campaign_id);
          const fullDetailsUrl = getApiUrl(getDetailsUrl, clientId);
          
          const campaignDetails = await requestWithCookieRenewal(
            fetchCampaignDetails,
            [fullDetailsUrl, campaign_id, "GET"],
            { tokenMap, storeKey, clientId }
          );

          // Extract vendor_ids from campaign details
          const vendorIds = campaignDetails.data?.promotion?.vendor_ids || [];

          // Get the cookie for product search
          const cookie = tokenMap[storeKey];

          // Step 2: Search for products and prepare payload
          const inputData = await prepareProductPayloadInput(
            actionKey,
            campaign_id,
            product_search_term,
            campaignDetails,
            vendorIds,
            entity,
            cookie
          );
          
          const payload = payloadFn.buildPayload(inputData);
          
          // Step 3: Call PUT API with modified payload
          const httpMethod = typeUrl?.[actionKey]?.method || "PUT";
          const response = await actionApiCall(action_url, payload, {
            storeKey,
            tokenMap,
            clientId,
            method: httpMethod,
          });

          // Format message
          const productsList = inputData.promotion.products
            .map(p => p.master_code)
            .join(", ");
          
          const productCount = inputData.promotion.products.length || 0;
          
          results.push({
            campaign_id,
            campaign_name: campaignDetails.data?.promotion?.name,
            product_name: product_search_term,
            success: true,
            message: `Action "${actionKey}" completed for product: ${product_search_term}`,
            action: actionKey,
          });
        } catch (err) {
          results.push({
            campaign_id: item?.campaign_id,
            campaign_name: item?.campaign_name,
            product_name: item?.product_search_term,
            success: false,
            message: getErrorMessage({
              action: String(item?.action || "").toLowerCase(),
              campaignCode: item?.campaign_id,
              product: item?.product_search_term,
              error: err,
            }),
          });
        }
      }

      res.json({
        success: true,
        message: "product actions completed",
        data: results,
      });
    } catch (error) {
      console.error("Error in editProduct:", error);
      res.status(500).json({
        success: false,
        message: "Error performing product operations",
        error: error.message,
      });
    }
  },
};

function getErrorMessage({ action, campaignCode, product, error }) {
  return `Action "${action}" failed for search term "${product}" in campaign "${campaignCode}". Error: ${error?.message || error}`;
}

module.exports = productController;
