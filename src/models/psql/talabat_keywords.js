const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const talabat_keywords = sequelize.define(
    "talabat_keywords",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      keyword: {
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
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "talabat_keywords",
      timestamps: false, // already handled with default value in schema
    }
  );

  return talabat_keywords;
};
