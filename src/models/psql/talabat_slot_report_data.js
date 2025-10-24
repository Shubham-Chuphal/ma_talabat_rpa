const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const talabat_slot_report_data = sequelize.define(
    "talabat_slot_report_data",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      slot: {
        type: DataTypes.STRING, // targetValue
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
      tableName: "talabat_slot_report_data",
      timestamps: false, // already handled with default value in schema
    }
  );

  return talabat_slot_report_data;
};
