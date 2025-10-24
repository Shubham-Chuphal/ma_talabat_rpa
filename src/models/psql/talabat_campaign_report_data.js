const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
  const TalabatCampaignReportData = sequelize.define(
    "talabat_campaign_report_data",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      campaign_name: {
        type: DataTypes.TEXT,
      },
      campaign_id: {
        type: DataTypes.STRING,
      },
      campaign_type: {
        type: DataTypes.STRING,
      },
      ad_type: {
        type: DataTypes.STRING,
      },
      account_id: {
        type: DataTypes.STRING,
      },
      account: {
        type: DataTypes.TEXT,
      },
      created_on: {
        type: DataTypes.STRING,
      },
      clicks: {
        type: DataTypes.BIGINT,
      },
      impressions: {
        type: DataTypes.BIGINT,
      },
      orders: {
        type: DataTypes.BIGINT,
      },
      sales: {
        type: DataTypes.DECIMAL,
      },
      spend: {
        type: DataTypes.DECIMAL,
      },
      unit_sold: {
        type: DataTypes.BIGINT,
      },
      created_at: {
        type: DataTypes.DATE, // maps to TIMESTAMPTZ in Postgres
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "talabat_campaign_report_data",
      timestamps: false, // since we're handling created_at manually
    }
  );

  return TalabatCampaignReportData;
};
