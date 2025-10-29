const axiosInstance = require("../../../utils/axiosInstance");

async function fetchCampaignDetails(url, campaignCode, method = "POST", cookie) {
  let response;
  const cookie1 = 'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleW1ha2VyLWFkeC0wMDE0LXVzZXIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2RoYWRzLmRoLWF1dGguaW8iLCJzdWIiOiJiMTkzNDQ0OC0zMmM1LTQzMjktYmMyZi1hZjdhZGUwZWIwODciLCJhdWQiOiJvcHMtcG9ydGFsLWRoYWRzLXRiIiwiZXhwIjoxNzYxNzAxNzI2LCJpYXQiOjE3NjE2OTgxMjYsImp0aSI6ImFmMjI2MG91MjJoMTRydGp1YmRoN3QxenB6ejVxenNjNXkzbXZnYm0iLCJzY29wZSI6IiIsImVtYWlsIjoidGFsYWJhdC5tZWRpYUBlLWdlbmllLmFpIiwidXVpZCI6ImU2YzQ5Njk3LWVjY2ItNGFhYy1hNDUyLTYwM2JlYWZiODJmOSIsIm5hbWUiOiJHZW5pZSBBSSIsIm5hbWVzcGFjZXMiOlsiR0xPQkFMIiwiSEZfRUciLCJUQl9BRSIsIlRCX0JIIiwiVEJfSVEiLCJUQl9KTyIsIlRCX0tXIiwiVEJfT00iLCJUQl9RQSJdLCJhcHBsaWNhdGlvbnMiOnsib3BzLXBvcnRhbC1kaGFkcyI6IkRlbGl2ZXJ5IEhlcm8gQWRzIn0sInBlcm1pc3Npb25zIjp7Im9wcy1wb3J0YWwtZGhhZHMiOnsiR0xPQkFMIjpbInZpZXciXSwiSEZfRUciOlsicm9sZTplZGl0b3IiLCJzb3VyY2U6ZXh0ZXJuYWwiXSwiVEJfQUUiOlsicm9sZTplZGl0b3IiLCJzb3VyY2U6ZXh0ZXJuYWwiXSwiVEJfQkgiOlsicm9sZTplZGl0b3IiLCJzb3VyY2U6ZXh0ZXJuYWwiXSwiVEJfSVEiOlsicm9sZTplZGl0b3IiLCJzb3VyY2U6ZXh0ZXJuYWwiXSwiVEJfSk8iOlsicm9sZTplZGl0b3IiLCJzb3VyY2U6ZXh0ZXJuYWwiXSwiVEJfS1ciOlsicm9sZTplZGl0b3IiLCJzb3VyY2U6ZXh0ZXJuYWwiXSwiVEJfT00iOlsicm9sZTplZGl0b3IiLCJzb3VyY2U6ZXh0ZXJuYWwiXSwiVEJfUUEiOlsicm9sZTplZGl0b3IiLCJzb3VyY2U6ZXh0ZXJuYWwiXX19fQ.G1Yq6I7I6c2x0DNLlAh1748GTM5C6cJWsb-JIroIgtA5rP186P-UY97Vd-OOws0c3JKzdM9rtU2SvMbl2TpYwoMk9zmRiA8tG0JPiXZriLjm3uZPCj5Gsato-1zG1HVwv1qRIODYoVOd2DFAEh993vO4zkjyRAaAfqm_WA6rWNy6_ChbU3fJLNThYYE2qY_z-bud5mgIdRVNzfxk9Ii2cyDWFRyf_2Vu-z-PHR59RlL-ElpfP32G6qw24KckRv85m_LGijfIIJfkCbi6DvYLUEFqLvq3eg_3_YW1q8oIh31WQqeZ8aTGb7gVWUZxVF6U2N3uGvebPihQYzC3xP5ClA'
  if (method === "GET") {
    // For GET requests, campaign_id is already in the URL
    response = await axiosInstance.get(url, {
      cookieString: cookie1,
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

    case "add_negative":
    case "remove_negative":
      // Prepare incoming: unique, trimmed (preserve original case)
      const incomingRaw = Array.isArray(value) ? value : value ? [value] : [];
      const incoming = Array.from(
        new Set(incomingRaw.map((k) => String(k).trim()).filter(Boolean))
      );

      // Existing list from prefetch (use as-is from Talabat without normalization)
      const existing = Array.isArray(campaignDetails?.negativeKeywords)
        ? campaignDetails.negativeKeywords
        : [];

      let finalList;
      if (action === "add_negative") {
        // Add only those incoming that don't already exist (case-insensitive check), preserve order
        const existingLower = new Set(
          existing.map((k) => String(k).toLowerCase())
        );
        const toAdd = incoming.filter(
          (k) => !existingLower.has(String(k).toLowerCase())
        );
        finalList = [...existing, ...toAdd];
      } else {
        // Remove: loop and remove each incoming (case-insensitive), preserving existing order
        const removeLower = new Set(
          incoming.map((k) => String(k).toLowerCase())
        );
        finalList = existing.filter(
          (k) => !removeLower.has(String(k).toLowerCase())
        );
      }

      return {
        campaignCode: campaign_id,
        negativeKeywords: finalList,
      };

    // Add other cases if needed

    default:
      throw new Error(`Unhandled action ${action}`);
  }
};

/**
 * Transform GET campaign details response to PUT payload format
 * Merges existing campaign data with updates
 */
function transformCampaignForPut(campaignData, updates = {}) {
  const payload = {
    name: updates.name || campaignData.name,
    status: updates.status || campaignData.status,
    start_at: updates.start_at || campaignData.start_at,
    end_at:
      updates.end_date === "-1"
        ? ""
        : updates.end_date
          ? `${updates.end_date}T23:59:59.999Z`
          : campaignData?.end_at,
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
        total: updates.budget !== undefined ? updates.budget : campaignData.pricing?.budget?.total,
        daily: updates.daily_budget !== undefined ? updates?.daily_budget : campaignData?.pricing?.budget?.daily,
        consumed: campaignData.pricing?.budget?.consumed || 0,
      },
      default_bid: updates.cpm_bid !== undefined ? updates?.cpm_bid : campaignData?.pricing?.default_bid || 0,
      is_free: campaignData?.pricing?.is_free || false,
      custom_bids: campaignData?.pricing?.custom_bids || [],
    },
    targeting: {
      schedules: campaignData?.targeting?.schedules || [
        {
          weekdays: ["mo", "tu", "we", "th", "fr", "sa", "su"],
          is_all_day: true,
        },
      ],
      placements: campaignData?.targeting?.placements || [],
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
  
  // Normalize targetValue to array for consistent processing
  const targetKeywords = Array.isArray(targetValue) ? targetValue : [targetValue];
  
  let updatedKeywords = [...existingKeywords];
  const existingKeywordsLower = new Set(
    existingKeywords.map(kw => String(kw).toLowerCase().trim())
  );

  switch (action) {
    case "enable":
      // Add keywords that don't exist (case-insensitive check)
      targetKeywords.forEach(keyword => {
        const keywordLower = String(keyword).toLowerCase().trim();
        if (!existingKeywordsLower.has(keywordLower)) {
          updatedKeywords.push(keyword);
          existingKeywordsLower.add(keywordLower); // Track to avoid duplicates in same batch
        }
      });
      break;

    case "disable":
      // Remove keywords (case-insensitive)
      const toRemoveLower = new Set(
        targetKeywords.map(kw => String(kw).toLowerCase().trim())
      );
      updatedKeywords = existingKeywords.filter(
        kw => !toRemoveLower.has(String(kw).toLowerCase().trim())
      );
      break;

    case "bid":
      // For bid changes, we need to update custom_bids
      // Ensure keywords exist in the keywords array
      targetKeywords.forEach(keyword => {
        const keywordLower = String(keyword).toLowerCase().trim();
        if (!existingKeywordsLower.has(keywordLower)) {
          updatedKeywords.push(keyword);
          existingKeywordsLower.add(keywordLower);
        }
      });
      break;

    default:
      throw new Error(`Unsupported keyword action: ${action}`);
  }

  // Build the complete campaign payload with updated keywords
  const payload = {
    name: campaignData.name,
    status: campaignData.status,
    start_at: campaignData.start_at,
    end_at: campaignData.end_at,
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
        daily: campaignData.pricing?.budget?.daily,
        consumed: campaignData.pricing?.budget?.consumed || 0,
      },
      default_bid: campaignData.pricing?.default_bid || 0,
      is_free: campaignData.pricing?.is_free || false,
      custom_bids: campaignData.pricing?.custom_bids || [],
    },
    targeting: {
      schedules: campaignData.targeting?.schedules || [
        {
          weekdays: ["mo", "tu", "we", "th", "fr", "sa", "su"],
          is_all_day: true,
        },
      ],
      placements: campaignData.targeting?.placements || [],
    },
    creatives: campaignData.creatives || [],
  };

  // For bid action, also update custom_bids if needed
  if (action === "bid" && bid !== undefined) {
    // Process each keyword for bid updates
    targetKeywords.forEach(keyword => {
      const keywordLower = String(keyword).toLowerCase().trim();
      
      // Find existing custom bid for this keyword
      const existingBidIndex = payload.pricing.custom_bids.findIndex(
        cb => String(cb.search_keyword).toLowerCase().trim() === keywordLower
      );

      if (existingBidIndex >= 0) {
        // Update existing bid
        payload.pricing.custom_bids[existingBidIndex].bid = bid;
      } else {
        // Add new custom bid
        payload.pricing.custom_bids.push({
          bid: bid,
          search_keyword: keyword,
          slots: [1, 2, 3], // Default slots
          position: "",
          screen: "",
        });
      }
    });
  }

  return {
    ...payload,
    // targetType,
    // targetValue: Array.isArray(targetValue) ? targetValue : targetValue,
    // bid,
    // campaignCode: campaign_id,
    // processedKeywords: targetKeywords, // For logging/debugging
  };
}

module.exports = {
  fetchCampaignDetails,
  checkNameExists,
  preparePayloadInput,
  transformCampaignForPut,
  prepareKeywordPayloadInput,
};
