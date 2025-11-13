const {
  formatCampaignRow,
  formatProductRow,
  // formatCategoryRow,
  formatKeywordRow,
  // formatSlotRow,
  formatCampaignAttributionRow,
  formatProductAttributionRow,
  formatKeywordAttributionRow,
  formatCategoryAttributionRow,
  formatSlotAttributionRow,
} = require("../services/rowFormatters");

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
              params: { size: 50, page: 0, start_date, end_date },
              data: {
                account_ids: [accountId],
                campaign_ids: [campaignId],
              },
            }),
            model: "talabat_products",
            outputKey: "products",
            dataExtractor: (data) => data?.data || [],
            format: formatProductRow,
            deleteWhere: ({ rows, db }) => {
              const Op = db.Op;
              const accountIds = Array.from(
                new Set(rows.map((r) => r.account_id).filter(Boolean))
              );
              if (accountIds.length === 0) return null;
              return {
                [Op.and]: [
                  { account_id: { [Op.in]: accountIds } },
                  { [Op.or]: [{ status: "active" }, { status: null }] },
                ],
              };
            },
          },
          {
            type: "Keywords",
            subUrl: "performance/keywords",
            method: "POST",
            getPayload: ({ campaignId, start_date, end_date, accountId }) => ({
              params: { size: 50, page: 0, start_date, end_date },
              data: {
                account_ids: [accountId],
                campaign_ids: [campaignId],
              },
            }),
            model: "talabat_keywords",
            outputKey: "keywords",
            dataExtractor: (data) => data?.data || [],
            format: formatKeywordRow,
            deleteWhere: ({ rows, db }) => {
              const Op = db.Op;
              const accountIds = Array.from(
                new Set(rows.map((r) => r.account_id).filter(Boolean))
              );
              if (accountIds.length === 0) return null;
              return {
                [Op.and]: [
                  { account_id: { [Op.in]: accountIds } },
                  { [Op.or]: [{ status: "active" }, { status: null }] },
                ],
              };
            },
          },
        ],
      },
    ],
  },
  {
    "Custom Data": [
      {
        // This subUrl will be overridden in the controller, but we keep the block here.
        subUrl: "",
        method: "GET",
        getPayload: () => ({}),
        model: "talabat_campaigns",
        dataExtractor: (data) => data || [],
        format: (row) => row,
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
          // {
          //   type: "Categories",
          //   subUrl: "performance/categories",
          //   method: "POST",
          //   getPayload: ({ campaignId, start_date, end_date, accountId }) => ({
          //     params: {
          //       size: 1000,
          //       page: 0,
          //       start_date,
          //       end_date,
          //     },
          //     data: {
          //       account_ids: [accountId],
          //       campaign_ids: [campaignId],
          //       ad_format: "display_ad",
          //       placements: [],
          //     },
          //   }),
          //   model: "talabat_sub_category",
          //   outputKey: "categories",
          //   dataExtractor: (data) => data?.data || [],
          //   format: formatCategoryRow,
          // },
          // {
          //   type: "Slots",
          //   subUrl: "performance/slots",
          //   method: "POST",
          //   getPayload: ({ campaignId, start_date, end_date, accountId }) => ({
          //     params: {
          //       size: 1000,
          //       page: 0,
          //       start_date,
          //       end_date,
          //     },
          //     data: {
          //       account_ids: [accountId],
          //       campaign_ids: [campaignId],
          //       ad_format: "display_ad",
          //       placements: [],
          //     },
          //   }),
          //   model: "talabat_slots",
          //   outputKey: "slots",
          //   dataExtractor: (data) => data?.data || [],
          //   format: formatSlotRow,
          // },
        ],
      },
    ],
  },
];

const ATTRIBUTION_CONFIG = [
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
        model: "talabat_campaign_report_data",
        dataExtractor: (data) => data?.data || [],
        format: formatCampaignAttributionRow,

        otherFetch: [
          {
            type: "Products",
            subUrl: "performance/products",
            method: "POST",
            getPayload: ({ campaignId, start_date, end_date, accountId }) => ({
              params: { size: 50, page: 0, start_date, end_date },
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
            subUrl: "performance/categories",
            method: "POST",
            getPayload: ({ campaignId, start_date, end_date, accountId }) => ({
              params: { size: 50, page: 0, start_date, end_date },
              data: {
                account_ids: [accountId],
                campaign_ids: [campaignId],
              },
            }),
            model: "talabat_sub_category_report_data", // align with model file
            outputKey: "categories",
            dataExtractor: (data) => data?.data || [],
            format: formatCategoryAttributionRow,
          },
          {
            type: "Keywords",
            subUrl: "performance/keywords",
            method: "POST",
            getPayload: ({ campaignId, start_date, end_date, accountId }) => ({
              params: { size: 50, page: 0, start_date, end_date },
              data: {
                account_ids: [accountId],
                campaign_ids: [campaignId],
              },
            }),
            model: "talabat_keyword_report_data",
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
        model: "talabat_campaign_report_data",
        dataExtractor: (data) => data?.data || [],
        format: formatCampaignAttributionRow,

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
                ad_format: "display_ad",
                placements: [],
              },
            }),
            model: "talabat_sub_category_report_data",
            outputKey: "categories",
            dataExtractor: (data) => data?.data || [],
            format: formatCategoryAttributionRow,
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
                ad_format: "display_ad",
                placements: [],
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
        campaign_details: "_svc/mx-instant-api-plamanager/pla/campaign/details",
        negative_keyword_list:
          "_svc/mx-instant-api-plamanager/pla/campaign/negative-keyword/list",

        update_name: {
          preCheckUrl:
            "_svc/mx-instant-api-plamanager/pla/campaign-name/is-exist",
          url: "_svc/mx-instant-api-plamanager/pla/campaign/update-name",
        },
        status: {
          url: "_svc/mx-instant-api-plamanager/pla/campaign/set-is-active",
        },
        budget: {
          url: "_svc/mx-instant-api-plamanager/pla/campaign/inline-action",
        },
        change_date: {
          preFetchRequired: true,
          url: "_svc/mx-instant-api-plamanager/pla/campaign/update",
        },
        // For negative keywords update (add/remove computed in controller)
        add_negative: {
          preFetchRequired: true,
          url: "_svc/mx-instant-api-plamanager/pla/campaign-negative-keyword/update",
        },
        remove_negative: {
          preFetchRequired: true,
          url: "_svc/mx-instant-api-plamanager/pla/campaign-negative-keyword/update",
        },
      },
      product: {
        enable: {
          url: "_svc/mx-instant-api-plamanager/pla/campaign-sku/enable",
        },
        disable: {
          url: "_svc/mx-instant-api-plamanager/pla/campaign-sku/disable",
        },
      },

      keyword: {
        bid: {
          url: "_svc/mx-instant-api-plamanager/pla/campaign-target/edit-bid",
        },
        disable: {
          url: "_svc/mx-instant-api-plamanager/pla/campaign-target/disable",
        },
        enable: {
          url: "_svc/mx-instant-api-plamanager/pla/campaign-target/enable",
        },
      },
    },
  },

  payloadMap: {
    "product ad": "productAdPayload",
  },

  allowedActions: {
    "product ad": {
      campaign: [
        "budget",
        "status",
        "change_date",
        "update_name",
        "add_negative",
        "remove_negative",
      ],
      product: ["enable", "disable"],
      keyword: ["bid", "disable", "enable"],
    },
  },

  payloadTemplates: {
    "product ad": {
      campaign: {
        budget: {
          buildPayload: ({ code, amount }) => ({
            categoryKey: "edit_budget",
            actionKey: "set_daily_budget",
            code,
            payload: {
              daily_budget_local: amount,
              amount,
            },
          }),
          message: ({ amount, campaign_id }) =>
            `Budget updated to ${amount} for campaign ID ${campaign_id}`,
        },

        status: {
          buildPayload: ({ campaignCode, isActive }) => ({
            campaignCode,
            isActive,
          }),
          message: ({ isActive, campaign_id }) =>
            `Campaign ${campaign_id} is now ${isActive ? "Active" : "Paused"}`,
        },

        change_date: {
          buildPayload: ({
            campaignName,
            campaignCode,
            dailyBudgetLocal,
            localStartDate,
            localEndDate,
          }) => ({
            campaignName,
            portfolioName: null,
            dailyBudgetLocal,
            topSlotBidPercent: 0,
            localStartDate,
            localEndDate,
            searchMatchType: "manual",
            isActive: true,
            campaignCode,
          }),
          message: ({ campaign_id }) =>
            `Campaign dates updated successfully for campaign ID ${campaign_id}`,
        },

        update_name: {
          buildPayload: ({ campaignName }) => ({
            campaignName,
          }),
          message: ({ campaignName, campaign_id }) =>
            `Campaign name updated to "${campaignName}" for campaign ID ${campaign_id}`,
        },

        add_negative: {
          buildPayload: ({ campaignCode, negativeKeywords }) => ({
            campaignCode,
            negativeKeywords,
          }),
          message: ({ campaignCode, negativeKeywords }) =>
            `Updated negative keywords for campaign ${campaignCode}. New list: ${
              Array.isArray(negativeKeywords) ? negativeKeywords.join(", ") : ""
            }`,
        },
        remove_negative: {
          buildPayload: ({ campaignCode, negativeKeywords }) => ({
            campaignCode,
            negativeKeywords,
          }),
          message: ({ campaignCode, negativeKeywords }) =>
            `Updated negative keywords for campaign ${campaignCode}. New list: ${
              Array.isArray(negativeKeywords) ? negativeKeywords.join(", ") : ""
            }`,
        },
      },

      product: {
        enable: {
          buildPayload: ({ campaignCode, sku }) => ({ campaignCode, sku }),
          message: ({ sku, campaignCode }) =>
            `SKU ${sku} enabled successfully for campaign ${campaignCode}`,
        },
        disable: {
          buildPayload: ({ campaignCode, sku }) => ({ campaignCode, sku }),
          message: ({ sku, campaignCode }) =>
            `SKU ${sku} disabled successfully for campaign ${campaignCode}`,
        },
      },

      keyword: {
        bid: {
          // input: { campaignCode, targetType, targetValue, bid }
          buildPayload: ({ campaignCode, targetType, targetValue, bid }) => ({
            campaignCode,
            targetType,
            targetValue,
            bid,
          }),
          message: ({ campaignCode, targetValue, bid }) =>
            `Keyword ${targetValue} bid set to ${bid} for campaign ${campaignCode}`,
        },
        disable: {
          // input: { campaignCode, targetType, targetValue }
          buildPayload: ({ campaignCode, targetType, targetValue }) => ({
            campaignCode,
            targetType,
            targetValue,
          }),
          message: ({ campaignCode, targetValue }) =>
            `Keyword ${targetValue} disabled for campaign ${campaignCode}`,
        },
        enable: {
          // same payload as disable
          buildPayload: ({ campaignCode, targetType, targetValue }) => ({
            campaignCode,
            targetType,
            targetValue,
          }),
          message: ({ campaignCode, targetValue }) =>
            `Keyword ${targetValue} enabled for campaign ${campaignCode}`,
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
