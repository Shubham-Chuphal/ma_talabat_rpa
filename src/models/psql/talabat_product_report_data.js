const { DataTypes } = require("sequelize");
module.exports = (sequelize, Sequelize) => {
  const talabat_product_report_data = sequelize.define(
    "talabat_product_report_data",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      campaign_name: {
        type: DataTypes.STRING,
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
        type: DataTypes.STRING,
      },
      product_name: {
        type: DataTypes.STRING,
      },
      product_id: {
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
      tableName: "talabat_product_report_data",
      timestamps: false,
    }
  );

  return talabat_product_report_data;
};
