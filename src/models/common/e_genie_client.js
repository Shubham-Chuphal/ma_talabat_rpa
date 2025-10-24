const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
  const e_genie_client = sequelize.define(
    "e_genie_client",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      client_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      service_started_date: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      db_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      client_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      country_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      currency_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        field: "created_at",
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        field: "updated_at",
      },
      "6p_access": {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "e_genie_client",
      timestamps: true,
      underscored: false,
    }
  );

  return e_genie_client;
};
