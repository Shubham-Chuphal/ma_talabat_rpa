const { getApiUrl, actionApiCall } = require("../../services/actionApi");
const { fetchTalabatTokenArray } = require("../../utils/getCookies");
const { getConnectedDatabases } = require("../../db/connect");
const { ACTION_CONFIG } = require("../../constants");
const productController = {
  editProduct: async (req, res) => {
    try {
      let { products, platformId = "9" } = req.body;
      const clientId = req.body.clientId || req.query.clientId;

      if (!clientId) {
        throw new Error("Missing required clientId in request");
      }

      if (!Array.isArray(products) || products.length === 0) {
        throw new Error("Products must be a non-empty array");
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

      const tokenMap = cookiesArray.reduce((acc, item) => {
        const [store, cookie] = Object.entries(item)[0];
        acc[store.toLowerCase()] = cookie;
        return acc;
      }, {});
      const results = [];

      for (const item of products) {
        try {
          const { campaign_id, product_id, account_id, action, campaign_type } =
            item || {};
          if (!campaign_id || !product_id || !action) {
            throw new Error(
              "Each item must include campaign_id, product_id and action"
            );
          }

          const typeKey = (campaign_type || "product ad").toLowerCase().trim();
          let storeKey = (account_id || "").toLowerCase().trim();
          const actionKey = String(action).toLowerCase().trim();

          const allowedForType =
            ACTION_CONFIG.allowedActions[typeKey]?.product || [];
          if (!allowedForType.includes(actionKey)) {
            throw new Error(
              `Action '${actionKey}' is not allowed for product type '${typeKey}'`
            );
          }

          const typeUrl = actionConfig.typeSuffixUrl[typeKey]?.["product"];
          const action_url = getApiUrl(typeUrl?.[actionKey]?.url);
          const payloadFn =
            actionConfig.payloadTemplates[typeKey]?.["product"]?.[actionKey];

          if (!typeUrl || !payloadFn || !action_url) {
            throw new Error(
              `Unsupported action: ${typeKey}/product/${actionKey}`
            );
          }

          const inputData = { campaignCode: campaign_id, sku: product_id };
          const payload = payloadFn.buildPayload(inputData);

          // Call Talabat API with cookie renewal + retries
          const response = await actionApiCall(action_url, payload, {
            storeKey,
            tokenMap,
            clientId,
          });

          results.push({
            campaign_id,
            product_id,
            success: true,
            message: payloadFn?.message
              ? payloadFn.message({ ...inputData })
              : `Action "${actionKey}" completed for SKU ${product_id} in campaign ${campaign_id}`,
            action: actionKey,
            data: response,
          });
        } catch (err) {
          results.push({
            campaignCode: item?.campaign_id,
            product_id: item?.product_id,
            success: false,
            message: getErrorMessage({
              action: String(item?.action || "").toLowerCase(),
              campaignCode: item?.campaign_id,
              product_id: item?.product_id,
              error: err,
            }),
          });
        }
      }

      res.json({
        success: true,
        message: "Bulk product actions completed",
        data: results,
      });
    } catch (error) {
      console.error("Error in editProduct controller:", error);
      res.status(500).json({
        success: false,
        message: "Error performing product actions",
        error: error.message,
      });
    }
  },
};

function getErrorMessage({ action, campaignCode, product_id, error }) {
  return `❌ Action "${action}" failed for SKU "${product_id}" in campaign "${campaignCode}". Error: ${error}`;
}

module.exports = productController;
