const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const talabat_products = sequelize.define(
    "talabat_products",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      product_name: {
        type: DataTypes.TEXT,
      },
      product_id: {
        type: DataTypes.STRING,
      },
      status: {
        type: DataTypes.STRING,
      },
      image: {
        type: DataTypes.TEXT,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      account: {
        type: DataTypes.STRING,
      },
      account_id: {
        type: DataTypes.STRING,
      },
      campaign_id: {
        type: DataTypes.STRING,
      },
      campaign_name: {
        type: DataTypes.TEXT,
      },
      campaign_type: {
        type: DataTypes.STRING,
      },
      ad_type: { type: DataTypes.STRING },
    },
    {
      tableName: "talabat_products",
      timestamps: false,
    }
  );

  return talabat_products;
};
