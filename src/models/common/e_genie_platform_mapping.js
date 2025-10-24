const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
  const e_genie_platform_mapping = sequelize.define(
    "e_genie_platform_mapping",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      platform_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      client_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      monthly_sync: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      token_data: {
        type: DataTypes.JSONB,
      },
      login_details: {
        type: DataTypes.JSONB,
      },
    },
    {
      tableName: "e_genie_platform_mapping",
      timestamps: true, // since you have createdAt and updatedAt
      underscored: false,
    }
  );

  return e_genie_platform_mapping;
};
