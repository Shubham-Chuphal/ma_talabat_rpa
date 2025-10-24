const { writeDebugLog } = require("../utils/debugLog");
/**
 * Get token info using clientId and platformId from `e_genie_platform_mapping` table
 * @param {string|number} clientId
 * @param {string|number} platformId
 * @param {object} commonDB - DB connection (i.e., db.common)
 * @returns {Promise<Object|null>}
 */
async function getTokenByClientAndPlatform(clientId, platformId, commonDB) {
  if (!clientId || !platformId) {
    throw new Error("Both clientId and platformId are required");
  }

  const model = commonDB?.models?.e_genie_platform_mapping;
  if (!model) {
    throw new Error("Model 'e_genie_platform_mapping' not found in common DB");
  }

  const mapping = await model.findOne({
    where: {
      client_id: clientId,
      platform_id: platformId,
    },
    attributes: ["token_data"],
    raw: true,
  });

  if (!mapping) return null;

  return mapping;
}

/**
 * Get all brands for a given client ID from `talabat_common_brands` table
 * @param {string|number} clientId
 * @param {object} commonDB - DB connection (i.e., db.common)
 * @returns {Promise<Array>}
 */
async function getBrandsByClientId(clientId, commonDB) {
  if (!clientId) throw new Error("Client ID is required");

  const model = commonDB?.models?.talabat_common_brands;
  if (!model) {
    throw new Error("Model 'talabat_common_brands' not found in common DB");
  }

  const brands = await model.findAll({
    where: { client_id: clientId },
    attributes: ["brand_name", "brand_id"],
    raw: true,
  });

  return brands;
}

async function getTalabatCampaigns(pgClientDb, where = {}, options = {}) {
  const model = pgClientDb.models.talabat_campaigns;
  if (!model) {
    throw new Error("Model 'talabat_campaigns' not found in pgClientDb");
  }
  return await model.findAll({ where, raw: true, ...options });
}

async function insertDataWithDeletion({
  db,
  modelName,
  rows,
  transaction,
  where = {},
  logger,
}) {
  const model = db.models[modelName];
  if (!model) {
    logger(
      `[insertDataWithDeletion][ERROR] Model "${modelName}" not found in db`
    );
    throw new Error(`Model "${modelName}" not found in db`);
  }

  try {
    const isConditionalDelete = where && Object.keys(where).length > 0;

    logger(
      `[insertDataWithDeletion] ${
        isConditionalDelete ? "Deleting with condition" : "Truncating"
      } table: ${modelName}`
    );

    if (isConditionalDelete) {
      await model.destroy({ where, transaction });
    } else {
      await model.destroy({
        truncate: true,
        restartIdentity: true, // Optional: reset auto-increment
        cascade: true, // Optional: cascade to FK children
        transaction,
      });
    }

    logger(`[insertDataWithDeletion] Delete complete for table: ${modelName}`);

    if (rows.length > 0) {
      logger(
        `[insertDataWithDeletion] Bulk inserting ${rows.length} rows into ${modelName}`
      );
      await model.bulkCreate(rows, { transaction });
      logger(
        `[insertDataWithDeletion] Bulk insert complete for table: ${modelName}`
      );
    } else {
      logger(
        `[insertDataWithDeletion] No rows to insert for table: ${modelName}`
      );
    }
  } catch (error) {
    logger(`[insertDataWithDeletion][ERROR] ${error.stack || error.message}`);
    throw error;
  }
}

module.exports = {
  getTokenByClientAndPlatform,
  getBrandsByClientId,
  insertDataWithDeletion,
  getTalabatCampaigns,
};
