const {
  formatCampaignRow,
  formatProductRow,
  formatCategoryRow,
  formatKeywordRow,
  formatSlotRow,
  formatCampaignAttributionRow,
  formatProductAttributionRow,
  formatCategoryAttributionRow,
  formatKeywordAttributionRow,
  formatSlotAttributionRow,
} = require("../services/rowFormatters");

const getLocalDateRange = (date) => {
  return {
    localStartDate: `${date}T23:59:59+05:30`,
    localEndDate: `${date}T23:59:59+05:30`,
  };
};

const STRUCTURE_CONFIG = [
  {
    "Product Ads": [
      {
        subUrl: "performance/campaigns",
        method: "POST",
        getPayload: ({ start_date, end_date, accountId }) => ({
          params: {
            size: 50,
            page: 0,
            start_date,
            end_date,
          },
          data: {
            account_ids: [accountId],
            campaign_ids: [],
            ad_format: "product_ad",
          },
        }),
        model: "talabat_campaigns",
        dataExtractor: (data) => data?.data || [],
        format: formatCampaignRow,

        otherFetch: [
          {
            type: "Products",
            subUrl: "performance/products",
            method: "POST",
            getPayload: ({ campaignId, start_date, end_date, accountId }) => ({
              params: {
                size: 50,
                page: 0,
                start_date,
                end_date,
              },
              data: {
                account_ids: [accountId],
                campaign_ids: [campaignId],
              },
            }),
            model: "talabat_products",
            outputKey: "products",
            dataExtractor: (data) => data?.data || [],
            format: formatProductRow,
          },
          {
            type: "Categories",
            subUrl: "performance/categories",
            method: "POST",
            getPayload: ({ campaignId, start_date, end_date, accountId }) => ({
              params: {
                size: 50,
                page: 0,
                start_date,
                end_date,
              },
              data: {
                account_ids: [accountId],
                campaign_ids: [campaignId],
              },
            }),
            model: "talabat_categories",
            outputKey: "categories",
            dataExtractor: (data) => data?.data || [],
            format: formatCategoryRow,
          },
          {
            type: "Keywords",
            subUrl: "performance/keywords",
            method: "POST",
            getPayload: ({ campaignId, start_date, end_date, accountId }) => ({
              params: {
                size: 50,
                page: 0,
                start_date,
                end_date,
              },
              data: {
                account_ids: [accountId],
                campaign_ids: [campaignId],
              },
            }),
            model: "talabat_keywords",
            outputKey: "keywords",
            dataExtractor: (data) => data?.data || [],
            format: formatKeywordRow,
          },
        ],
      },
    ],
  },
  {
    "Display Ads": [
      {
        subUrl: "performance/campaigns",
        method: "POST",
        getPayload: ({ start_date, end_date, accountId }) => ({
          params: {
            size: 1000,
            page: 0,
            start_date,
            end_date,
          },
          data: {
            account_ids: [accountId],
            campaign_ids: [],
            ad_format: "display_ad",
          },
        }),
        model: "talabat_campaigns",
        dataExtractor: (data) => data?.data || [],
        format: formatCampaignRow,

        otherFetch: [
          {
            type: "Categories",
            subUrl: "performance/categories",
            method: "POST",
            getPayload: ({ campaignId, start_date, end_date, accountId }) => ({
              params: {
                size: 1000,
                page: 0,
                start_date,
                end_date,
              },
              data: {
                account_ids: [accountId],
                campaign_ids: [campaignId],
              },
            }),
            model: "talabat_categories",
            outputKey: "categories",
            dataExtractor: (data) => data?.data || [],
            format: formatCategoryRow,
          },
          {
            type: "Slots",
            subUrl: "performance/slots",
            method: "POST",
            getPayload: ({ campaignId, start_date, end_date, accountId }) => ({
              params: {
                size: 1000,
                page: 0,
                start_date,
                end_date,
              },
              data: {
                account_ids: [accountId],
                campaign_ids: [campaignId],
              },
            }),
            model: "talabat_slots",
            outputKey: "slots",
            dataExtractor: (data) => data?.data || [],
            format: formatSlotRow,
          },
        ],
      },
    ],
  },
];

const ATTRIBUTION_CONFIG = [
  {
    "Product Ads": [
      {
        subUrl: "_svc/mx-instant-api-plamanager/pla/v3/campaign/list",
        method: "POST",
        getPayload: ({ start_date, end_date, accountId }) => ({
          params: {
            size: 1000,
            page: 0,
            start_date,
            end_date,
          },
          data: {
            account_ids: [accountId],
            campaign_ids: [],
            ad_format: "product_ad",
          },
        }),
        model: "talabat_campaign_report_data",
        dataExtractor: (data) => data?.data || [],
        format: formatCampaignAttributionRow,

        otherFetch: [
          {
            type: "Products",
            subUrl: "_svc/mx-instant-api-plamanager/pla/campaign/product/list",
            method: "POST",
            getPayload: ({ campaignId, start_date, end_date, accountId }) => ({
              params: {
                size: 1000,
                page: 0,
                start_date,
                end_date,
              },
              data: {
                account_ids: [accountId],
                campaign_ids: [campaignId],
              },
            }),
            model: "talabat_product_report_data",
            outputKey: "products",
            dataExtractor: (data) => data?.data || [],
            format: formatProductAttributionRow,
          },
          {
            type: "Categories",
            subUrl: "_svc/mx-instant-api-plamanager/pla/campaign/category/list",
            method: "POST",
            getPayload: ({ campaignId, start_date, end_date, accountId }) => ({
              params: {
                size: 1000,
                page: 0,
                start_date,
                end_date,
              },
              data: {
                account_ids: [accountId],
                campaign_ids: [campaignId],
              },
            }),
            model: "talabat_categories_report_data",
            outputKey: "categories",
            dataExtractor: (data) => data?.data || [],
            format: formatCategoryAttributionRow,
          },
          {
            type: "Keywords",
            subUrl: "_svc/mx-instant-api-plamanager/pla/campaign/target/list",
            method: "POST",
            getPayload: ({ campaignId, start_date, end_date, accountId }) => ({
              params: {
                size: 1000,
                page: 0,
                start_date,
                end_date,
              },
              data: {
                account_ids: [accountId],
                campaign_ids: [campaignId],
              },
            }),
            model: "talabat_target_report_data",
            outputKey: "keywords",
            dataExtractor: (data) => data?.data || [],
            format: formatKeywordAttributionRow,
          },
        ],
      },
    ],
  },
  {
    "Display Ads": [
      {
        subUrl: "_svc/mx-instant-api-externaladsmanager/campaign/list",
        method: "POST",
        getPayload: ({ start_date, end_date, accountId }) => ({
          params: {
            size: 1000,
            page: 0,
            start_date,
            end_date,
          },
          data: {
            account_ids: [accountId],
            campaign_ids: [],
            ad_format: "display_ad",
          },
        }),
        model: "talabat_campaign_report_data",
        dataExtractor: (data) => data?.data || [],
        format: formatCampaignAttributionRow,

        otherFetch: [
          {
            type: "Categories",
            subUrl:
              "_svc/mx-instant-api-externaladsmanager/campaign/product/list",
            method: "POST",
            getPayload: ({ campaignId, start_date, end_date, accountId }) => ({
              params: {
                size: 1000,
                page: 0,
                start_date,
                end_date,
              },
              data: {
                account_ids: [accountId],
                campaign_ids: [campaignId],
              },
            }),
            model: "talabat_product_report_data",
            outputKey: "categories",
            dataExtractor: (data) => data?.data || [],
            format: formatProductAttributionRow,
          },
          {
            type: "Slots",
            subUrl:
              "_svc/mx-instant-api-externaladsmanager/campaign/source/list",
            method: "POST",
            getPayload: ({ campaignId, start_date, end_date, accountId }) => ({
              params: {
                size: 1000,
                page: 0,
                start_date,
                end_date,
              },
              data: {
                account_ids: [accountId],
                campaign_ids: [campaignId],
              },
            }),
            model: "talabat_slot_report_data",
            outputKey: "slots",
            dataExtractor: (data) => data?.data || [],
            format: formatSlotAttributionRow,
          },
        ],
      },
    ],
  },
];

const ACTION_CONFIG = {
  allowedCampaignTypes: ["product ad"],

  typeSuffixUrl: {
    "product ad": {
      campaign: {
        campaign_details: {
          url: "campaigns/:campaign_id",
          method: "GET",
        },
        update_name: {
          preCheckUrl: "campaigns/:campaign_id",
          url: "campaigns/:campaign_id",
          method: "PUT",
        },
        status: {
          url: "campaigns/:campaign_id/status",
          method: "PATCH",
        },
        budget: {
          url: "campaigns/:campaign_id",
          method: "PUT",
        },
        daily_budget: {
          url: "campaigns/:campaign_id",
          method: "PUT",
        },
        cpm_bid: {
          url: "campaigns/:campaign_id",
          method: "PUT",
        },
        change_date: {
          url: "campaigns/:campaign_id",
          method: "PUT",
        },
        day_parting: {
          url: "campaigns/:campaign_id",
          method: "PUT",
        },
      },
      product: {
        enable: {
          url: "campaigns/:campaign_id",
          method: "PUT",
        },
        disable: {
          url: "campaigns/:campaign_id",
          method: "PUT",
        },
      },

      keyword: {
        bid: {
          url: "campaigns/:campaign_id",
          method: "PUT",
        },
        disable: {
          url: "campaigns/:campaign_id",
          method: "PUT",
        },
        enable: {
          url: "campaigns/:campaign_id",
          method: "PUT",
        },
      },
    },
    "display ad": {
      campaign: {
        campaign_details: {
          url: "campaigns/:campaign_id",
          method: "GET",
        },
        update_name: {
          preCheckUrl: "campaigns/:campaign_id",
          url: "campaigns/:campaign_id",
          method: "PUT",
        },
        status: {
          url: "campaigns/:campaign_id/status",
          method: "PATCH",
        },
        budget: {
          url: "campaigns/:campaign_id",
          method: "PUT",
        },
        daily_budget: {
          url: "campaigns/:campaign_id",
          method: "PUT",
        },
        cpm_bid: {
          url: "campaigns/:campaign_id",
          method: "PUT",
        },
        change_date: {
          url: "campaigns/:campaign_id",
          method: "PUT",
        },
        day_parting: {
          url: "campaigns/:campaign_id",
          method: "PUT",
        },
      },
      product: {
        enable: {
          url: "campaigns/:campaign_id",
          method: "PUT",
        },
        disable: {
          url: "campaigns/:campaign_id",
          method: "PUT",
        },
      },

      keyword: {
        bid: {
          url: "campaigns/:campaign_id",
          method: "PUT",
        },
        disable: {
          url: "campaigns/:campaign_id",
          method: "PUT",
        },
        enable: {
          url: "campaigns/:campaign_id",
          method: "PUT",
        },
      },
    },
  },

  payloadMap: {
    "product ad": "productAdPayload",
    "display ad": "displayAdPayload",
  },

  allowedActions: {
    "product ad": {
      campaign: [
        "budget",
        "daily_budget",
        "cpm_bid",
        "status",
        "change_date",
        "update_name",
        "day_parting",
      ],
      product: ["enable", "disable"],
      keyword: ["bid", "disable", "enable"],
    },
    "display ad": {
      campaign: [
        "budget",
        "daily_budget",
        "cpm_bid",
        "status",
        "change_date",
        "update_name",
        "day_parting",
      ],
      product: ["enable", "disable"],
      keyword: ["bid", "disable", "enable"],
    },
  },

  payloadTemplates: {
    "product ad": {
      campaign: {
        budget: {
          buildPayload: (payload) => {
            // If payload has the full campaign structure (from transformCampaignForPut), return as-is
            if (payload.name && payload.promotion && payload.pricing) {
              return payload;
            }
            // Legacy format fallback
            return {
              categoryKey: "edit_budget",
              actionKey: "Total_budget",
              code: payload.code,
              payload: {
                daily_budget_local: payload.amount,
                amount: payload.amount,
              },
            };
          },
          message: ({ amount, campaign_id, pricing }) =>
            `Budget updated to ${amount || pricing?.budget?.total} for campaign ID ${campaign_id}`,
        },
         daily_budget: {
          buildPayload: (payload) => {
            // If payload has the full campaign structure (from transformCampaignForPut), return as-is
            if (payload.name && payload.promotion && payload.pricing) {
              return payload;
            }
            // Legacy format fallback
            return {
              categoryKey: "edit_budget",
              actionKey: "Daily_budget",
              code: payload.code,
              payload: {
                daily_budget_local: payload.amount,
                amount: payload.amount,
              },
            };
          },
          message: ({ amount, campaign_id, pricing }) =>
            `Daily budget updated to ${amount || pricing?.budget?.daily} for campaign ID ${campaign_id}`,
        },
         cpm_bid: {
          buildPayload: (payload) => {
            // If payload has the full campaign structure (from transformCampaignForPut), return as-is
            if (payload.name && payload.promotion && payload.pricing) {
              return payload;
            }
            // Legacy format fallback
            return {
              categoryKey: "edit_budget",
              actionKey: "Cpm_bid",
              code: payload.code,
              payload: {
                daily_budget_local: payload.amount,
                amount: payload.amount,
              },
            };
          },
          message: ({ amount, campaign_id, pricing }) =>
            `CPM Bid updated to ${amount || pricing?.default_bid} for campaign ID ${campaign_id}`,
        },

        status: {
          buildPayload: ({ status }) => ({
            status: status ? status : null
          }),
          message: ({ status, campaign_id }) =>
            `Campaign ${campaign_id} is now ${status === "active" ? "Active" : status === "paused" ? "Paused" : status === "cancelled" ? "Cancelled" : status}`,
        },

        change_date: {
          buildPayload: (payload) => {
            // If payload has the full campaign structure (from transformCampaignForPut), return as-is
            if (payload.name && payload.promotion && payload.pricing) {
              return payload;
            }
            // Legacy format fallback
            return {
              campaignName: payload.campaignName,
              portfolioName: null,
              dailyBudgetLocal: payload.dailyBudgetLocal,
              topSlotBidPercent: 0,
              localStartDate: payload.localStartDate,
              localEndDate: payload.localEndDate,
              searchMatchType: "manual",
              isActive: true,
              campaignCode: payload.campaignCode,
            };
          },
          message: ({ campaign_id, end_at }) =>
            `Campaign dates updated successfully for campaign ID ${campaign_id}${end_at ? ` (end date: ${end_at})` : ' (always on)'}`,
        },

        update_name: {
          buildPayload: (payload) => {
            // If payload has the full campaign structure (from transformCampaignForPut), return as-is
            if (payload.name && payload.promotion && payload.pricing) {
              return payload;
            }
            // Legacy format fallback
            return {
              campaignName: payload.campaignName,
            };
          },
          message: ({ campaignName, campaign_id, name }) =>
            `Campaign name updated to "${name || campaignName}" for campaign ID ${campaign_id}`,
        },
         day_parting: {
          buildPayload: (payload) => {
            // If payload has the full campaign structure (from transformCampaignForPut), return as-is
            if (payload.name && payload.promotion && payload.pricing) {
              return payload;
            }
            // Legacy format fallback
            return {
              campaignName: payload.campaignName,
            };
          },
          message: ({ campaignName, campaign_id, targeting }) =>
            // `Day parting action updated to "${targeting.schedules || campaignName}" for campaign ID ${campaign_id}`,
            `Day parting action updated for campaign ID ${campaign_id}`,

        },
      },

      product: {
        enable: {
          buildPayload: (payload) => {
            // If payload has the full campaign structure, return as-is
            if (payload.name && payload.promotion && payload.pricing) {
              return payload;
            }
            // Legacy format fallback
            return {
              campaignCode: payload.campaignCode,
              sku: payload.sku,
            };
          },
          message: ({ productsList }) => {
            return ` The updated products list: "${productsList}"`;
          },
        },
        disable: {
          buildPayload: (payload) => {
            // If payload has the full campaign structure, return as-is
            if (payload.name && payload.promotion && payload.pricing) {
              return payload;
            }
            // Legacy format fallback
            return {
              campaignCode: payload.campaignCode,
              sku: payload.sku,
            };
          },
          message: ({  productsList }) => {
            return `The updated products list: "${productsList}"`;
          },
        },
      },

      keyword: {
        bid: {
          buildPayload: (payload) => {
            // If payload has the full campaign structure, return as-is
            if (payload.name && payload.promotion && payload.pricing) {
              return payload;
            }
            // Legacy format fallback
            return {
              campaignCode: payload.campaignCode,
              targetType: payload.targetType,
              targetValue: payload.targetValue,
              bid: payload.bid,
            };
          },
          message: ({ campaignCode, keywordsList, keywordCount, bid }) => {
            if (keywordCount > 1) {
              return `Bid set to ${bid} for ${keywordCount} keywords: "${keywordsList}" in campaign ${campaignCode}`;
            }
            return `Keyword "${keywordsList}" bid set to ${bid} for campaign ${campaignCode}`;
          },
        },
        disable: {
          buildPayload: (payload) => {
            // If payload has the full campaign structure, return as-is
            if (payload.name && payload.promotion && payload.pricing) {
              return payload;
            }
            // Legacy format fallback
            return {
              campaignCode: payload.campaignCode,
              targetType: payload.targetType,
              targetValue: payload.targetValue,
            };
          },
          message: ({ campaign_id, keywordsList }) => {   
            return `The updated keyword list: "${keywordsList}" for campaign ${campaign_id}`;
          },
        },
        enable: {
          buildPayload: (payload) => {
            // If payload has the full campaign structure, return as-is
            if (payload.name && payload.promotion && payload.pricing) {
              return payload;
            }
            // Legacy format fallback
            return {
              campaignCode: payload.campaignCode,
              targetType: payload.targetType,
              targetValue: payload.targetValue,
            };
          },
          message: ({ campaign_id, keywordsList }) => {
            return `The updated keyword list: "${keywordsList}" for campaign ${campaign_id}`;
          },
        },
      },
    },
  },
};

module.exports = {
  "perfetti-prod": "perfetti_staging",
  "eveready-prod": "eveready_development",
  tcpl_india: "tcpl_staging",
  reckitt_staging_my: "eveready_development",

  STRUCTURE_CONFIG,
  ATTRIBUTION_CONFIG,
  ACTION_CONFIG,
  // Add more constants here
};
