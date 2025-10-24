// Talabat Attribution Row Formatters
// Each formatter expects (row, type, brandLookup, created_on)

function formatCampaignRow(row, brandLookup, cookieKey, existingData, adType) {
  const brand_name = brandLookup[cookieKey];
  // Prefer new API fields, fallback to old
  const campaign_id = row.id || row.campaignCode || row.campaign_id || null;
  const campaign_name = row.name || row.campaignName || row.campaign_name || null;
  const start_date = row.start_date || row.localStartDate || null;
  const end_date = row.end_date || row.localEndDate || null;
  const ad_type = row.ad_type || (Array.isArray(row.ad_types) ? row.ad_types[0] : null) || row.type || null;
  const pricing_model = row.pricing_model || null;
  const budget =
    row.budget != null
      ? Number(row.budget)
      : row.dailyBudgetLocal != null
      ? Number(row.dailyBudgetLocal)
      : null;
  const pinTimestamp = existingData[campaign_id] || null;

  return {
    campaign_id,
    campaign_name,
    campaign_type: adType,
    ad_type,
    pricing_model,
    start_date,
    end_date,
    budget,
    status: row.status,
    created_by: row.created_by || null,
    pin: pinTimestamp || null,
    account_id: cookieKey,
    account: brand_name,
    formatted: true,
    entityType: "Campaign",
  };
}

function formatProductRow(row) {
  const campaign = row.campaign || {};
  return {
    product_name: row.name || row.productName || null,
    product_id: row.master_product_code || row.id || row.sku || row.product_id || null,
    image: row.image_url || row.image || null,
    account: campaign.account || null,
    account_id: campaign.account_id || null,
    campaign_id: campaign.campaign_id || null,
    campaign_name: campaign.campaign_name || null,
    campaign_type: campaign.campaign_type,
    ad_type: campaign.ad_type || null,
    formatted: true,
    entityType: "Product",
  };
}

function formatCategoryRow(row) {
  const campaign = row.campaign || {};
  return {
    // Map to talabat_sub_category model
    category: row.name || row.slotPlacement || row.placement || null,
    category_id: row.id || null,
    campaign_type: campaign.campaign_type,
    ad_type: campaign.ad_type || null,
    campaign_id: campaign.campaign_id || null,
    campaign_name: campaign.campaign_name || null,
    account_id: campaign.account_id || null,
    account: campaign.account || null,
    formatted: true,
    entityType: "Category",
  };
}

function formatKeywordRow(row) {
  const campaign = row.campaign || {};
  return {
    // Map to talabat_keywords model
    keyword: row.keyword || row.targetValue || null,
    campaign_id: campaign.campaign_id || null,
    campaign_name: campaign.campaign_name || null,
    account: campaign.account || null,
    account_id: campaign.account_id || null,
    campaign_type: campaign.campaign_type,
    ad_type: campaign.ad_type || null,
    formatted: true,
    entityType: "Keyword",
  };
}

function formatSlotRow(row) {
  const campaign = row.campaign || {};
  return {
    source: row.source || null,
    deeplink: row.deeplink || null,
    campaign_id: campaign.campaign_id || null,
    campaign_name: campaign.campaign_name || null,
    campaign_type: campaign.campaign_type,
    account_id: campaign.account_id || null,
    account: campaign.account || null,
    formatted: true,
    entityType: "Slot",
  };
}

// ATTRIBUTION ROW FORMATTERS

function formatCampaignAttributionRow(
  row,
  brandLookup,
  cookieKey,
  existingData = [],
  adType,
  created_on
) {
  const brand_name = brandLookup[cookieKey];
  return {
    // DB columns mapped from Talabat API fields
    campaign_id: row.campaignCode,
    campaign_name: row.campaignName,
    campaign_type: adType,
    campaign_sub_type: row.type || null,

    // Account fields
    account_id: cookieKey,
    account: brand_name,

    // Dates
    created_on,

    // Metrics
    views: row.views || 0,
    clicks: row.clicks || 0,
    revenue: row.revenue || 0,
    spends: row.spends || 0,
    orders: row.orders || 0,
    missed_revenue: row.missedRevenue,
    avg_time_in_budget: row.avgTimeInBudget,
    avg_budget_utilization: row.avgBudgetUtilization,

    // Metadata
    formatted: true,
    entityType: "Campaign",
  };
}

function formatProductAttributionRow(row, created_on) {
  // Use campaign context if present
  const campaign = row.campaign || {};

  return {
    // Product fields
    product_name: row.productName || null,
    product_id: row.sku || row.product_id || null,
    product_brand: row.brand || null,
    image: row.image || null,

    // Campaign fields
    campaign_id: campaign.campaign_id || null,
    campaign_name: campaign.campaign_name || null,
    campaign_type: campaign.campaign_type || null,
    campaign_sub_type: campaign.campaign_sub_type || null,

    // Account fields
    account_id: campaign.account_id || null,
    account: campaign.account || null,

    // Dates
    created_on,

    // Metrics
    views: row.views || 0,
    clicks: row.clicks || 0,
    revenue: row.revenue || 0,
    spends: row.spends || 0,
    orders: row.orders || 0,

    // Metadata
    formatted: true,
    entityType: "Product",
  };
}

function formatKeywordAttributionRow(row, created_on) {
  const campaign = row.campaign || {};

  return {
    // Targeting fields
    target: row.targetValue || null,
    target_type: row.targetType || null,
    description: row.targetDescription || null,

    // Campaign fields
    campaign_id: campaign.campaign_id || null,
    campaign_name: campaign.campaign_name || null,
    campaign_type: campaign.campaign_type || null,
    campaign_sub_type: campaign.campaign_sub_type || null,

    // Account fields
    account_id: campaign.account_id || null,
    account: campaign.account || null,

    // Dates
    created_on,

    // Metrics
    views: row.views || 0,
    clicks: row.clicks || 0,
    revenue: row.revenue || 0,
    spends: row.spends || 0,
    orders: row.orders || 0,

    // Metadata
    formatted: true,
    entityType: "Keyword",
  };
}

function formatCategoryAttributionRow(row, created_on) {
  const campaign = row.campaign || {};
  return {
    // Placement field
    placement: row.slotPlacement || row.placement || null,

    // Campaign fields
    campaign_id: campaign.campaign_id || null,
    campaign_name: campaign.campaign_name || null,
    campaign_type: campaign.campaign_type || null,
    campaign_sub_type: campaign.campaign_sub_type || null,

    // Account fields
    account_id: campaign.account_id || null,
    account: campaign.account || null,

    // Dates
    created_on,

    // Metrics
    views: row.views || 0,
    clicks: row.clicks || 0,
    revenue: row.revenue || 0,
    spends: row.spends || 0,
    orders: row.orders || 0,

    // Metadata
    formatted: true,
    entityType: "Category",
  };
}

function formatSlotAttributionRow(row, created_on) {
  const campaign = row.campaign || {};

  return {
    // Source fields
    source: row.source || null,
    deeplink: row.deeplink || null,

    // Campaign fields
    campaign_id: campaign.campaign_id || null,
    campaign_name: campaign.campaign_name || null,
    campaign_type: campaign.campaign_type || null,

    // Account fields
    account_id: campaign.account_id || null,
    account: campaign.account || null,

    // Dates
    created_on,

    // Metrics
    orders: row.orders || 0,
    unit_sales: row.unitsSales || 0, // Note: unitsSales (camelCase) from API
    revenue: row.revenue || 0,
    sessions: row.sessions || 0,
    visitors: row.visitors || 0,
    conversion_rate: row.conversionRate || 0, // Note: conversionRate (camelCase) from API

    // Metadata
    formatted: true,
    entityType: "Slot",
  };
}

module.exports = {
  formatCategoryRow,
  formatKeywordRow,
  formatProductRow,
  formatCampaignRow,
  formatSlotRow,
  formatCampaignAttributionRow,
  formatProductAttributionRow,
  formatKeywordAttributionRow,
  formatCategoryAttributionRow,
  formatSlotAttributionRow,
};
