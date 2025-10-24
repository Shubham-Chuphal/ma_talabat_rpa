const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
  const talabat_campaigns = sequelize.define(
    "talabat_campaigns",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      campaign_id: { type: DataTypes.STRING }, // campaignCode
      campaign_type: { type: DataTypes.STRING },
      ad_type: { type: DataTypes.STRING },
      pricing_model: { type: DataTypes.STRING },
      campaign_name: { type: DataTypes.TEXT }, // campaignName
      start_date: { type: DataTypes.STRING }, // localStartDate
      end_date: { type: DataTypes.STRING }, // localEndDate
      budget: { type: DataTypes.DECIMAL }, // dailyBudgetLocal
      status: { type: DataTypes.STRING }, // status
      created_by: { type: DataTypes.STRING },
      pin: { type: DataTypes.DATE }, // time with time zone (closest support in Sequelize)
      updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      account: { type: DataTypes.STRING },
      account_id: { type: DataTypes.STRING },
    },
    { tableName: "talabat_campaigns", timestamps: false }
  );

  return talabat_campaigns;
};
