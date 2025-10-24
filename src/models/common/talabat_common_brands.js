const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
  const talabat_common_brands = sequelize.define(
    "talabat_common_brands",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      brand_name: { type: DataTypes.STRING },
      brand_id: { type: DataTypes.STRING },
      client_id: { type: DataTypes.STRING },
      created_at: { type: DataTypes.DATE },
      updated_at: { type: DataTypes.DATE },
      status: { type: DataTypes.INTEGER },
    },
    {
      tableName: "talabat_common_brands",
      timestamps: false,
    }
  );

  return talabat_common_brands;
};
