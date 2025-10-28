const axiosInstance = require("../../../utils/axiosInstance");

async function fetchCampaignDetails(url, campaignCode, cookie) {
  const response = await axiosInstance.post(
    url,
    { campaignCode },
    {
      cookieString: cookie,
    }
  );

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

module.exports = {
  fetchCampaignDetails,
  checkNameExists,
  //   sendPostRequest,
  preparePayloadInput,
};
