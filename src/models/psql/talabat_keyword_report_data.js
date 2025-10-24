const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const talabat_keyword_report_data = sequelize.define(
    "talabat_keyword_report_data",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      keyword: {
        type: DataTypes.STRING,
      },

      campaign_id: {
        type: DataTypes.STRING,
      },
      campaign_name: {
        type: DataTypes.TEXT,
      },
      account_id: {
        type: DataTypes.STRING,
      },
      account: {
        type: DataTypes.STRING,
      },
      campaign_type: {
        type: DataTypes.STRING,
      },
      ad_type: {
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
      created_on: {
        type: DataTypes.STRING,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "talabat_keyword_report_data",
      timestamps: false, // Since we're handling timestamps manually
    }
  );

  return talabat_keyword_report_data;
};
