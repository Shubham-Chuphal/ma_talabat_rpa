const axiosInstance = require("../../../utils/axiosInstance");

async function fetchCampaignDetails(url, campaignCode, method = "POST", cookie) {
  let response;
  const cookie1 = 'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleW1ha2VyLWFkeC0wMDE0LXVzZXIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2RoYWRzLmRoLWF1dGguaW8iLCJzdWIiOiJiMTkzNDQ0OC0zMmM1LTQzMjktYmMyZi1hZjdhZGUwZWIwODciLCJhdWQiOiJvcHMtcG9ydGFsLWRoYWRzLXRiIiwiZXhwIjoxNzYyMzQ4NzM4LCJpYXQiOjE3NjIzNDUxMzgsImp0aSI6ImxiMXl1aDk4Y2ExYnMyOWVteXpmbmtqcmNqcTh4cWp1MGc1eTZxNXMiLCJzY29wZSI6IiIsImVtYWlsIjoidGFsYWJhdC5tZWRpYUBlLWdlbmllLmFpIiwidXVpZCI6ImU2YzQ5Njk3LWVjY2ItNGFhYy1hNDUyLTYwM2JlYWZiODJmOSIsIm5hbWUiOiJHZW5pZSBBSSIsIm5hbWVzcGFjZXMiOlsiR0xPQkFMIiwiSEZfRUciLCJUQl9BRSIsIlRCX0JIIiwiVEJfSVEiLCJUQl9KTyIsIlRCX0tXIiwiVEJfT00iLCJUQl9RQSJdLCJhcHBsaWNhdGlvbnMiOnsib3BzLXBvcnRhbC1kaGFkcyI6IkRlbGl2ZXJ5IEhlcm8gQWRzIn0sInBlcm1pc3Npb25zIjp7Im9wcy1wb3J0YWwtZGhhZHMiOnsiR0xPQkFMIjpbInZpZXciXSwiSEZfRUciOlsicm9sZTplZGl0b3IiLCJzb3VyY2U6ZXh0ZXJuYWwiXSwiVEJfQUUiOlsicm9sZTplZGl0b3IiLCJzb3VyY2U6ZXh0ZXJuYWwiXSwiVEJfQkgiOlsicm9sZTplZGl0b3IiLCJzb3VyY2U6ZXh0ZXJuYWwiXSwiVEJfSVEiOlsicm9sZTplZGl0b3IiLCJzb3VyY2U6ZXh0ZXJuYWwiXSwiVEJfSk8iOlsicm9sZTplZGl0b3IiLCJzb3VyY2U6ZXh0ZXJuYWwiXSwiVEJfS1ciOlsicm9sZTplZGl0b3IiLCJzb3VyY2U6ZXh0ZXJuYWwiXSwiVEJfT00iOlsicm9sZTplZGl0b3IiLCJzb3VyY2U6ZXh0ZXJuYWwiXSwiVEJfUUEiOlsicm9sZTplZGl0b3IiLCJzb3VyY2U6ZXh0ZXJuYWwiXX19fQ.jW51WUOSurmiU0wNIZcS6eL-6RoNHAGYs5dDjOwOd_1dSllM4C7L52Jw_X_blvTgTpJLfG7pF_5qiS0LrMxZ3IEs2lPHWaF9dOuZXwqWSN6-d1XiEeOQA2n4OGOKZaeHLtEBwr5roVla-w15-xmK6Fe9ceciExY5mQvV0lE630JeGSUzRxHg0AYZ6UDhxx5ySyDXLME7f8kPXcmwCqcBiAkFcXdMoFqAoy9D2FtpxLwGTi4DAD_KZ9qaQAxC2HYgCCODiW95XKXzs1rslSb_5AYw6esp6bTA4xWIPU86b6wRkIJHBpGWcwjhkV37UcvJ2XxisVbYZ5Ofdz4H9VzEjQ'
  if (method === "GET") {
    // For GET requests, campaign_id is already in the URL
    response = await axiosInstance.get(url, {
      cookieString: cookie,
    });
  } else {
    // For POST requests (legacy)
    response = await axiosInstance.post(
      url,
      { campaignCode },
      {
        cookieString: cookie,
      }
    );
  }

  return response.data;
}

async function checkNameExists(url, campaignName, cookie) {
  const response = await axiosInstance.post(
    url,
    { campaignName },
    {
      cookieString: cookie,
    }
  );

  // If the backend returns a boolean or truthy value directly
  return response.data ?? true;
}

const preparePayloadInput = (
  action,
  campaign_id,
  value,
  campaignDetails = {},
  campaign = {}
) => {
  // Use campaignDetails as main source, fallback to campaign object

  switch (action) {
    case "budget":
      // If we have full campaign details from GET, build complete payload
      if (campaignDetails.data) {
        return transformCampaignForPut(campaignDetails.data, { budget: value });
      }
      // Legacy fallback
      return {
        code: campaign_id,
        amount: value,
      };
    case "daily_budget":
      // If we have full campaign details from GET, build complete payload
      if (campaignDetails.data) {
        return transformCampaignForPut(campaignDetails.data, { daily_budget: value });
      }
      // Legacy fallback
      return {
        code: campaign_id,
        amount: value,
      };
    case "cpm_bid":
      // If we have full campaign details from GET, build complete payload
      if (campaignDetails.data) {
        return transformCampaignForPut(campaignDetails.data, { cpm_bid: value });
      }
      // Legacy fallback
      return {
        code: campaign_id,
        amount: value,
      };

    case "status":
      return {
        campaignCode: campaign_id,
        status: value,
      };

    case "change_date":
      // If we have full campaign details from GET, build complete payload
      if (campaignDetails.data) {
        return transformCampaignForPut(campaignDetails.data, { end_date: value });
      }
      // Legacy fallback
      const campaignName =
        campaignDetails.campaignName || campaign.campaignName || null;
      const dailyBudgetLocal =
        campaignDetails.dailyBudgetLocal ?? campaign.dailyBudgetLocal ?? null;
      const localStartDate =
        campaignDetails.localStartDate || campaign.localStartDate || null;
      return {
        campaignName,
        campaignCode: campaign_id,
        dailyBudgetLocal,
        localStartDate: localStartDate
          ? localStartDate.split("T")[0] + "T12:00:00+05:30"
          : null,
        localEndDate: value ? value + "T12:00:00+05:30" : null,
      };

    case "update_name":
      // If we have full campaign details from GET, build complete payload
      if (campaignDetails.data) {
        return transformCampaignForPut(campaignDetails.data, { name: value });
      }
      // Legacy fallback
      return {
        campaignName: value,
      };

    // Add other cases if needed
    case "day_parting":
      // If we have full campaign details from GET, build complete payload
      if (campaignDetails.data) {
        return transformCampaignForPut(campaignDetails.data, { day_parting: value });
      }
      // Legacy fallback
      return {
        code: campaign_id,
        amount: value,
      };
      
    default:
      throw new Error(`Unhandled action ${action}`);
  }
};

/**
 * Transform GET campaign details response to PUT payload format
 * Merges existing campaign data with updates
 */
function transformCampaignForPut(campaignData, updates = {}) {
  const hasDailyBudgetUpdate = updates.daily_budget !== undefined;

  const payload = {
    name: updates.name || campaignData.name,
    status: updates.status || campaignData.status,
    start_at: updates.start_at || campaignData.start_at,
     ...(() => {
    if (updates.end_date === "-1") {
      return {}; // omit end_at entirely
    }

    if (updates.end_date) {
      return { end_at: `${updates.end_date}T23:59:59.999Z` };
    }

    if (campaignData?.end_at) {
      return { end_at: campaignData.end_at };
    }

    return {};
  })(),
    promotion: {
      vendor_ids: campaignData.promotion?.vendor_ids || [],
      chain_ids: campaignData.promotion?.chain_ids || [],
      products: (campaignData.promotion?.products || []).map(product => ({
        master_code: product.master_code,
        category_group_ids: product.category_group_ids || product.original_category_group_ids || [],
      })),
      search: {
        keywords: campaignData.promotion?.search?.keywords || [],
      },
    },
    pricing: {
      budget: {
        total: updates.budget !== undefined
          ? updates.budget
          : campaignData.pricing?.budget?.total,

        // ✅ include daily if:
        // - user is explicitly updating daily_budget, OR
        // - campaign already has a daily budget field
        ...(hasDailyBudgetUpdate
          ? { daily: updates.daily_budget }
          : campaignData.pricing?.budget?.daily !== undefined
            ? { daily: campaignData.pricing.budget.daily }
            : {}),

        consumed: campaignData.pricing?.budget?.consumed || 0,
      },
      default_bid:
        updates.cpm_bid !== undefined
          ? updates.cpm_bid
          : campaignData?.pricing?.default_bid || 0,
      is_free: campaignData?.pricing?.is_free || false,
      custom_bids: campaignData?.pricing?.custom_bids || [],
    },
    targeting: {
      schedules:
        updates.day_parting ||
        campaignData.targeting?.schedules || [
          {
            weekdays: ["mo", "tu", "we", "th", "fr", "sa", "su"],
            is_all_day: true,
          },
        ],
      placements:
        campaignData.targeting?.placements?.map(({ ...rest }) => rest) || [],
    },
    creatives: campaignData?.creatives || [],
  };

  return payload;
}


/**
 * Prepare payload input for keyword actions (enable, disable, bid)
 * Modifies the campaign's keywords array based on the action
 * Supports both single keyword (string) and multiple keywords (array)
 */
function prepareKeywordPayloadInput(
  action,
  campaign_id,
  targetValue,
  bid,
  campaignDetails = {},
  targetType = "keyword"
) {
  if (!campaignDetails.data) {
    throw new Error("Campaign details are required for keyword actions");
  }

  const campaignData = campaignDetails.data;

  const existingKeywords = campaignData.promotion?.search?.keywords || [];
  const existingCustomBids = campaignData.pricing?.custom_bids || [];

  // Normalize targetValue to array for consistent processing
  const targetArray = Array.isArray(targetValue) ? targetValue : [targetValue];

  let updatedKeywords = [...existingKeywords];
  const existingKeywordsLower = new Set(
    existingKeywords.map(kw => String(kw).toLowerCase().trim())
  );

  switch (action) {
    case "enable":
      // Add keywords that don't exist
      targetArray.forEach(keyword => {
        const keywordLower = String(keyword).toLowerCase().trim();
        if (!existingKeywordsLower.has(keywordLower)) {
          updatedKeywords.push(keyword);
          existingKeywordsLower.add(keywordLower);
        }
      });
      break;

    case "disable":
      // Remove keywords
      const toRemoveLower = new Set(
        targetArray.map(kw => String(kw).toLowerCase().trim())
      );
      updatedKeywords = existingKeywords.filter(
        kw => !toRemoveLower.has(String(kw).toLowerCase().trim())
      );
      break;

    case "bid":
      // Ensure all search keywords from targetValue exist in promotion.search.keywords
      targetArray.forEach(({ search_keyword }) => {
        const keywordLower = String(search_keyword).toLowerCase().trim();
        if (!existingKeywordsLower.has(keywordLower)) {
          updatedKeywords.push(search_keyword);
          existingKeywordsLower.add(keywordLower);
        }
      });
      break;

    default:
      throw new Error(`Unsupported keyword action: ${action}`);
  }

  // Build base payload
  const payload = {
    name: campaignData.name,
    status: campaignData.status,
    start_at: campaignData.start_at,
    ...(campaignData.end_at ? { end_at: campaignData.end_at } : {}),
    promotion: {
      vendor_ids: campaignData.promotion?.vendor_ids || [],
      chain_ids: campaignData.promotion?.chain_ids || [],
      products: (campaignData.promotion?.products || []).map(product => ({
        master_code: product.master_code,
        category_group_ids: product.category_group_ids || product.original_category_group_ids || [],
      })),
      search: {
        keywords: updatedKeywords,
      },
    },
    pricing: {
      budget: {
        total: campaignData.pricing?.budget?.total,
        consumed: campaignData.pricing?.budget?.consumed || 0,
        ...(campaignData.pricing?.budget?.daily
          ? { daily: campaignData.pricing.budget.daily }
          : {}),
      },
      default_bid: campaignData.pricing?.default_bid || 0,
      is_free: campaignData.pricing?.is_free || false,
      custom_bids: [...existingCustomBids], // clone to modify
    },
    targeting: {
      schedules: campaignData.targeting?.schedules || [
        {
          weekdays: ["mo", "tu", "we", "th", "fr", "sa", "su"],
          is_all_day: true,
        },
      ],
      placements:
        campaignData.targeting?.placements?.map(({...rest }) => rest) || [],
    },
    creatives: campaignData.creatives || [],
  };

  // 🔹 Handle custom bid updates
  if (action === "bid") {
    targetArray.forEach(({ search_keyword, bid, slots }) => {
      const keywordLower = String(search_keyword).toLowerCase().trim();

      const existingBidIndex = payload.pricing.custom_bids.findIndex(
        cb => String(cb.search_keyword).toLowerCase().trim() === keywordLower
      );

      if (existingBidIndex >= 0) {
        // Update existing bid for this keyword
        payload.pricing.custom_bids[existingBidIndex] = {
          ...payload.pricing.custom_bids[existingBidIndex],
          bid,
          slots: slots || payload.pricing.custom_bids[existingBidIndex].slots || [],
        };
      } else {
        // Add new custom bid entry
        payload.pricing.custom_bids.push({
          search_keyword,
          bid,
          slots: slots || [],
        });
      }
    });
  }

  return payload;
}

/**
 * Search for products using the Talabat product search API
 * @param {string} searchTerm - The product name to search for
 * @param {string} entity - The entity code (e.g., "TB_AE")
 * @param {string} cookie - Authentication cookie
 * @returns {Promise<Array>} - Array of matching products
 */
async function searchProducts(searchTerm, entity = "TB_AE", cookie, vendorIds) {
  try {
    const encodedSearchTerm = encodeURIComponent(searchTerm);
    const data = {
      vendor_ids: vendorIds,
      by: "TERM",
    };

    console.log(data, "data");
    const cookie1 = "Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleW1ha2VyLWFkeC0wMDE0LXVzZXIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2RoYWRzLmRoLWF1dGguaW8iLCJzdWIiOiJiMTkzNDQ0OC0zMmM1LTQzMjktYmMyZi1hZjdhZGUwZWIwODciLCJhdWQiOiJvcHMtcG9ydGFsLWRoYWRzLXRiIiwiZXhwIjoxNzYyMzQ4NzM4LCJpYXQiOjE3NjIzNDUxMzgsImp0aSI6ImxiMXl1aDk4Y2ExYnMyOWVteXpmbmtqcmNqcTh4cWp1MGc1eTZxNXMiLCJzY29wZSI6IiIsImVtYWlsIjoidGFsYWJhdC5tZWRpYUBlLWdlbmllLmFpIiwidXVpZCI6ImU2YzQ5Njk3LWVjY2ItNGFhYy1hNDUyLTYwM2JlYWZiODJmOSIsIm5hbWUiOiJHZW5pZSBBSSIsIm5hbWVzcGFjZXMiOlsiR0xPQkFMIiwiSEZfRUciLCJUQl9BRSIsIlRCX0JIIiwiVEJfSVEiLCJUQl9KTyIsIlRCX0tXIiwiVEJfT00iLCJUQl9RQSJdLCJhcHBsaWNhdGlvbnMiOnsib3BzLXBvcnRhbC1kaGFkcyI6IkRlbGl2ZXJ5IEhlcm8gQWRzIn0sInBlcm1pc3Npb25zIjp7Im9wcy1wb3J0YWwtZGhhZHMiOnsiR0xPQkFMIjpbInZpZXciXSwiSEZfRUciOlsicm9sZTplZGl0b3IiLCJzb3VyY2U6ZXh0ZXJuYWwiXSwiVEJfQUUiOlsicm9sZTplZGl0b3IiLCJzb3VyY2U6ZXh0ZXJuYWwiXSwiVEJfQkgiOlsicm9sZTplZGl0b3IiLCJzb3VyY2U6ZXh0ZXJuYWwiXSwiVEJfSVEiOlsicm9sZTplZGl0b3IiLCJzb3VyY2U6ZXh0ZXJuYWwiXSwiVEJfSk8iOlsicm9sZTplZGl0b3IiLCJzb3VyY2U6ZXh0ZXJuYWwiXSwiVEJfS1ciOlsicm9sZTplZGl0b3IiLCJzb3VyY2U6ZXh0ZXJuYWwiXSwiVEJfT00iOlsicm9sZTplZGl0b3IiLCJzb3VyY2U6ZXh0ZXJuYWwiXSwiVEJfUUEiOlsicm9sZTplZGl0b3IiLCJzb3VyY2U6ZXh0ZXJuYWwiXX19fQ.jW51WUOSurmiU0wNIZcS6eL-6RoNHAGYs5dDjOwOd_1dSllM4C7L52Jw_X_blvTgTpJLfG7pF_5qiS0LrMxZ3IEs2lPHWaF9dOuZXwqWSN6-d1XiEeOQA2n4OGOKZaeHLtEBwr5roVla-w15-xmK6Fe9ceciExY5mQvV0lE630JeGSUzRxHg0AYZ6UDhxx5ySyDXLME7f8kPXcmwCqcBiAkFcXdMoFqAoy9D2FtpxLwGTi4DAD_KZ9qaQAxC2HYgCCODiW95XKXzs1rslSb_5AYw6esp6bTA4xWIPU86b6wRkIJHBpGWcwjhkV37UcvJ2XxisVbYZ5Ofdz4H9VzEjQ"
    const url = `https://qcat-dsp-me.deliveryhero.io/api/v1/entities/${entity}/products?page=0&size=10&search_term=${encodedSearchTerm}`;
    console.log("Product search URL:", url);

    const response = await axiosInstance.post(url, data, {
      cookieString: cookie,
    });

    console.log("Product search response:", response.data);
    return response.data?.data || [];
  } catch (error) {
    console.error("Error in searchProducts:", error.message);
    console.error("Error details:", error.response?.data || error);
    throw new Error(`Product search failed: ${error.message}`);
  }
}


/**
 * Prepare payload input for product actions (enable, disable)
 * Searches for products, extracts master_code and category_group_ids, and adds to campaign
 * @param {string} action - The action to perform (enable, disable)
 * @param {string} campaign_id - Campaign ID
 * @param {string} searchTerm - Product search term
 * @param {Object} campaignDetails - Campaign details from GET API
 * @param {Array} vendorIds - Vendor IDs to filter products (from campaign details)
 * @param {string} entity - Entity code (e.g., "TB_AE")
 * @param {string} cookie - Authentication cookie
 * @returns {Promise<Object>} - Complete campaign payload with updated products
 */
async function prepareProductPayloadInput(
  action,
  campaign_id,
  searchTerm,
  campaignDetails = {},
  vendorIds = [],
  entity = "TB_AE",
  cookie
) {
  try {
    if (!campaignDetails.data) {
      throw new Error("Campaign details are required for product actions");
    }

    const campaignData = campaignDetails.data;
    console.log("Campaign vendor_ids:", vendorIds);

    // Step 1: Search for products using the search API
    const searchResults = await searchProducts(searchTerm, entity, cookie, vendorIds);
    console.log(`Found ${searchResults.length} products from search`);

    if (!searchResults || searchResults.length === 0) {
      throw new Error(`No products found for search term: "${searchTerm}"`);
    }

    // Step 2: Filter products whose names exactly match the search term
    const filteredProducts = searchResults.filter(
      (product) => product.name.toLowerCase() === searchTerm.toLowerCase()
    );

    console.log(`Filtered to ${filteredProducts.length} exact matching products`);

    if (filteredProducts.length === 0) {
      throw new Error(`No products found matching the search term: "${searchTerm}"`);
    }

    // Step 3: Extract only master_code and category_group_ids
    const newProducts = filteredProducts.map((product) => ({
      master_code: product.master_product_code,
      category_group_ids: product.category_group_ids || [],
    }));

    console.log("Extracted products:", newProducts);

    // Step 4: Normalize existing products (keep only required fields)
    const existingProducts =
      (campaignData.promotion?.products || []).map((p) => ({
        master_code: p.master_code,
        category_group_ids: p.category_group_ids || [],
      })) || [];

    // Step 5: Merge products based on action
    let updatedProducts = [...existingProducts];

    switch (action) {
      case "enable": {
        const existingMasterCodes = new Set(existingProducts.map((p) => p.master_code));
        newProducts.forEach((newProduct) => {
          if (!existingMasterCodes.has(newProduct.master_code)) {
            updatedProducts.push(newProduct);
          } else {
            throw new Error(
              `Product with master_code ${newProduct.master_code} already exists in campaign`
            );
          }
        });
        break;
      }

      case "disable": {
        const masterCodesToRemove = new Set(newProducts.map((p) => p.master_code));
        updatedProducts = existingProducts.filter(
          (p) => !masterCodesToRemove.has(p.master_code)
        );
        break;
      }

      default:
        throw new Error(`Unsupported product action: ${action}`);
    }

    // Step 6: Build the complete campaign payload
    const payload = {
      name: campaignData.name,
      status: campaignData.status,
      start_at: campaignData.start_at,
      promotion: {
        vendor_ids: campaignData.promotion?.vendor_ids || [],
        chain_ids: campaignData.promotion?.chain_ids || [],
        products: updatedProducts, // ✅ only master_code + category_group_ids
        search: {
          keywords: campaignData.promotion?.search?.keywords || [],
        },
      },
      pricing: {
        budget: {
          total: campaignData.pricing?.budget?.total,
          consumed: campaignData.pricing?.budget?.consumed || 0,
          ...(campaignData.pricing?.budget?.daily
            ? { daily: campaignData.pricing.budget.daily }
            : {}),
        },
        default_bid: campaignData.pricing?.default_bid || 0,
        is_free: campaignData.pricing?.is_free || false,
        custom_bids: campaignData.pricing?.custom_bids || [],
      },
      targeting: {
        schedules:
          campaignData.targeting?.schedules || [
            {
              weekdays: ["mo", "tu", "we", "th", "fr", "sa", "su"],
              is_all_day: true,
            },
          ],
        placements:
          campaignData.targeting?.placements?.map(({ ...rest }) => rest) || [],
      },
      creatives: campaignData.creatives || [],
      ...(campaignData.end_at ? { end_at: campaignData.end_at } : {}),
    };

    return payload;
  } catch (error) {
    console.error("Error in prepareProductPayloadInput:", error.message);
    throw error;
  }
}


module.exports = {
  fetchCampaignDetails,
  checkNameExists,
  preparePayloadInput,
  transformCampaignForPut,
  prepareKeywordPayloadInput,
  searchProducts,
  prepareProductPayloadInput,
};
