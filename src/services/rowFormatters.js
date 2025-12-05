// Talabat Attribution Row Formatters
// Each formatter expects (row, type, brandLookup, created_on)

function formatCampaignRow(row, brandLookup, cookieKey, existingData, adType) {
  const brand_name = brandLookup[cookieKey];
  // Prefer new API fields, fallback to old
  const campaign_id = row.id || row.campaignCode || row.campaign_id || null;
  const campaign_name =
    row.name || row.campaignName || row.campaign_name || null;
  const start_date = row.start_date || row.localStartDate || null;
  const end_date = row.end_date || row.localEndDate || null;
  const ad_type =
    row.ad_type ||
    (Array.isArray(row.ad_types) ? row.ad_types[0] : null) ||
    row.type ||
    null;
  const pricing_model = row.pricing_model || null;
  const budget =
    row.budget != null
      ? Number(row.budget)
      : row.dailyBudgetLocal != null
      ? Number(row.dailyBudgetLocal)
      : null;
  const pinTimestamp = existingData[campaign_id] || null;

  const daily_budget = row.daily_budget || null;
  const cpm_bid = row.cpm_bid || null;

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
    daily_budget,
    cpm_bid,
  };
}

function formatProductRow(row) {
  const campaign = row.campaign || {};
  return {
    product_name: row.name || row.productName || null,
    product_id:
      row.master_product_code || row.id || row.sku || row.product_id || null,
    image: row.image_url || row.image || null,
    status: "active",
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
    // ! why is status active?
    status: "active",
    campaign_id: campaign.campaign_id || null,
    campaign_name: campaign.campaign_name || null,
    account: campaign.account || null,
    account_id: campaign.account_id || null,
    campaign_type: campaign.campaign_type,
    ad_type: campaign.ad_type || null,
    formatted: true,
    entityType: "Keyword",
    bid: campaign.bid || null,
  };
}

function formatSlotRow(row) {
  const campaign = row.campaign || {};
  return {
    slot: row.slot || null,
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
  // Prefer new API fields, fallback to old
  const campaign_id = row.id || row.campaignCode || row.campaign_id || null;
  const campaign_name =
    row.name || row.campaignName || row.campaign_name || null;
  const ad_type =
    row.ad_type ||
    (Array.isArray(row.ad_types) ? row.ad_types[0] : null) ||
    row.type ||
    null;
  const p = row.performance || {};

  return {
    // Identity
    campaign_id,
    campaign_name,
    campaign_type: adType,
    ad_type,

    // Account
    account_id: cookieKey,
    account: brand_name,

    // Dates
    created_on,

    // Metrics
    clicks: p.clicks || 0,
    impressions: p.impressions || 0,
    orders: p.orders || 0,
    sales: p.sales_revenue || 0,
    spend: p.total_ad_spend || 0,
    unit_sold: p.unit_sold || 0,

    // Meta
    formatted: true,
    entityType: "Campaign",
  };
}

function formatProductAttributionRow(row, created_on) {
  const campaign = row.campaign || {};
  const p = row.performance || {};
  return {
    // Product fields
    product_name: row.name || row.productName || null,
    product_id:
      row.master_product_code || row.id || row.sku || row.product_id || null,

    // Campaign fields
    campaign_id: campaign.campaign_id || null,
    campaign_name: campaign.campaign_name || null,
    campaign_type: campaign.campaign_type || null,
    ad_type: campaign.ad_type || null,

    // Account fields
    account_id: campaign.account_id || null,
    account: campaign.account || null,

    // Dates
    created_on,

    // Metrics
    clicks: p.clicks || 0,
    impressions: p.impressions || 0,
    orders: p.orders || 0,
    sales: p.sales_revenue || 0,
    spend: p.total_ad_spend || 0,
    unit_sold: p.unit_sold || 0,

    // Meta
    formatted: true,
    entityType: "Product",
  };
}

function formatCategoryAttributionRow(row, created_on) {
  const campaign = row.campaign || {};
  const p = row.performance || {};
  return {
    // Placement fields
    category: row.name || row.slotPlacement || row.placement || null,
    category_id: row.id || null,

    // Campaign fields
    campaign_id: campaign.campaign_id || null,
    campaign_name: campaign.campaign_name || null,
    campaign_type: campaign.campaign_type || null,
    ad_type: campaign.ad_type || null,

    // Account fields
    account_id: campaign.account_id || null,
    account: campaign.account || null,

    // Dates
    created_on,

    // Metrics
    clicks: p.clicks || 0,
    impressions: p.impressions || 0,
    orders: p.orders || 0,
    sales: p.sales_revenue || 0,
    spend: p.total_ad_spend || 0,
    unit_sold: p.unit_sold || 0,

    // Meta
    formatted: true,
    entityType: "Category",
  };
}

function formatKeywordAttributionRow(row, created_on) {
  const campaign = row.campaign || {};
  const p = row.performance || {};
  return {
    // Targeting fields
    keyword: row.keyword || row.targetValue || null,

    // Campaign fields
    campaign_id: campaign.campaign_id || null,
    campaign_name: campaign.campaign_name || null,
    campaign_type: campaign.campaign_type || null,
    ad_type: campaign.ad_type || null,

    // Account fields
    account_id: campaign.account_id || null,
    account: campaign.account || null,

    // Dates
    created_on,

    // Metrics
    clicks: p.clicks || 0,
    impressions: p.impressions || 0,
    orders: p.orders || 0,
    sales: p.sales_revenue || 0,
    spend: p.total_ad_spend || 0,
    unit_sold: p.unit_sold || 0,

    // Meta
    formatted: true,
    entityType: "Keyword",
  };
}

function formatSlotAttributionRow(row, created_on) {
  const campaign = row.campaign || {};
  const p = row.performance || {};
  return {
    // Slot
    slot: row.slot || null,

    // Campaign fields
    campaign_id: campaign.campaign_id || null,
    campaign_name: campaign.campaign_name || null,
    campaign_type: campaign.campaign_type || null,
    ad_type: campaign.ad_type || null,

    // Account fields
    account_id: campaign.account_id || null,
    account: campaign.account || null,

    // Dates
    created_on,

    // Metrics
    clicks: p.clicks || 0,
    impressions: p.impressions || 0,
    orders: p.orders || 0,
    sales: p.sales_revenue || 0,
    spend: p.total_ad_spend || 0,
    unit_sold: p.unit_sold || 0,

    // Meta
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
