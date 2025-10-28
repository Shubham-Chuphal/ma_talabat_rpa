const axiosInstance = require("../../../utils/axiosInstance");

async function fetchCampaignDetails(url, campaignCode, method = "POST", cookie) {
  let response;
  const cookie1 = 'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleW1ha2VyLWFkeC0wMDE0LXVzZXIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2RoYWRzLmRoLWF1dGguaW8iLCJzdWIiOiJiMTkzNDQ0OC0zMmM1LTQzMjktYmMyZi1hZjdhZGUwZWIwODciLCJhdWQiOiJvcHMtcG9ydGFsLWRoYWRzLXRiIiwiZXhwIjoxNzYxNjk2Mzg4LCJpYXQiOjE3NjE2OTI3ODgsImp0aSI6ImphejR0bWllc3hqcWwwaHUzajVzdGVpM2I0bDhnbzNjcnI1bHp0Zm4iLCJzY29wZSI6IiIsImVtYWlsIjoidGFsYWJhdC5tZWRpYUBlLWdlbmllLmFpIiwidXVpZCI6ImU2YzQ5Njk3LWVjY2ItNGFhYy1hNDUyLTYwM2JlYWZiODJmOSIsIm5hbWUiOiJHZW5pZSBBSSIsIm5hbWVzcGFjZXMiOlsiR0xPQkFMIiwiSEZfRUciLCJUQl9BRSIsIlRCX0JIIiwiVEJfSVEiLCJUQl9KTyIsIlRCX0tXIiwiVEJfT00iLCJUQl9RQSJdLCJhcHBsaWNhdGlvbnMiOnsib3BzLXBvcnRhbC1kaGFkcyI6IkRlbGl2ZXJ5IEhlcm8gQWRzIn0sInBlcm1pc3Npb25zIjp7Im9wcy1wb3J0YWwtZGhhZHMiOnsiR0xPQkFMIjpbInZpZXciXSwiSEZfRUciOlsicm9sZTplZGl0b3IiLCJzb3VyY2U6ZXh0ZXJuYWwiXSwiVEJfQUUiOlsicm9sZTplZGl0b3IiLCJzb3VyY2U6ZXh0ZXJuYWwiXSwiVEJfQkgiOlsicm9sZTplZGl0b3IiLCJzb3VyY2U6ZXh0ZXJuYWwiXSwiVEJfSVEiOlsicm9sZTplZGl0b3IiLCJzb3VyY2U6ZXh0ZXJuYWwiXSwiVEJfSk8iOlsicm9sZTplZGl0b3IiLCJzb3VyY2U6ZXh0ZXJuYWwiXSwiVEJfS1ciOlsicm9sZTplZGl0b3IiLCJzb3VyY2U6ZXh0ZXJuYWwiXSwiVEJfT00iOlsicm9sZTplZGl0b3IiLCJzb3VyY2U6ZXh0ZXJuYWwiXSwiVEJfUUEiOlsicm9sZTplZGl0b3IiLCJzb3VyY2U6ZXh0ZXJuYWwiXX19fQ.g5DVMsQZeG6QFldnjys6q8uCU6gVXQG-mQA0r0hIN80eMdMfp9koRm2F8COUlo_w2Nl9QADgFTOmltI8AqbnmAspT8VHD-fhD51rIhcXJD2ZL3Kq64--s8EYQnqoD92W7K-k9COWwZkTuUo9SeLixdIKiTC_nF7pEKP1MF_JcPML4GHPAvvoMA_UiyJM-jn5usWBW-E9WJLrNj0boEZlVA3VF5lR-kZt1MpWWmEFZSb-s6NlHeB8kRQgQpVvu50FqE30PMF_LAdbDfVTIZR5Sm67Rc-0WcUtfN2RqJs-qpGC9GGwARvjymQGUVcSWNT1y-20UrTaIrbNC2pIRk4kOA'
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

module.exports = {
  fetchCampaignDetails,
  checkNameExists,
  preparePayloadInput,
  transformCampaignForPut,
};
