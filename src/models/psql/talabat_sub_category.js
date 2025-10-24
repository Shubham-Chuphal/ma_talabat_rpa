const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const talabat_sub_category = sequelize.define(
    "talabat_sub_category",
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
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "talabat_sub_category",
      timestamps: false,
    }
  );

  return talabat_sub_category;
};
