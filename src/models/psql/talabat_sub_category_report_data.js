const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const talabat_sub_category_report_data = sequelize.define(
    "talabat_sub_category_report_data",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
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
        type: DataTypes.TEXT,
      },
      campaign_type: {
        type: DataTypes.STRING,
      },
      ad_type: {
        type: DataTypes.STRING,
      },
      category: {
        type: DataTypes.TEXT,
      },
      category_id: {
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
      tableName: "talabat_sub_category_report_data",
      timestamps: false,
    }
  );

  return talabat_sub_category_report_data;
};
