const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const talabat_slots = sequelize.define(
    "talabat_slots",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      slot: {
        type: DataTypes.STRING,
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

      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "talabat_slots",
      timestamps: false,
    }
  );

  return talabat_slots;
};
