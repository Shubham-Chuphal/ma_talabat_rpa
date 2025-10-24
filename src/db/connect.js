const Sequelize = require("sequelize");
const fs = require("fs");
const path = require("path");
const { Op } = Sequelize;
const { config, getDBCred } = require("../config");
const CONFIG = require("../constants");

const connection = {};

const initializeDB = async ({
  key,
  dialect,
  host,
  port,
  database,
  username,
  password,
  modelDir,
  ssl = false,
}) => {
  const sequelize = new Sequelize({
    host,
    port,
    database,
    username,
    password,
    dialect,
    logging: config.local_development,
    ...(ssl && {
      dialectOptions: {
        ssl: { require: true, rejectUnauthorized: false },
      },
    }),
  });

  try {
    await sequelize.authenticate();
    console.log(`Connected to ${dialect.toUpperCase()}: ${database}`);
  } catch (err) {
    console.error(`${dialect.toUpperCase()} connection error:`, err);
    throw new Error(`Failed to connect to ${database}: ${err.message}`);
  }

  const models = {};
  fs.readdirSync(modelDir).forEach((file) => {
    const name = file.replace(".js", "");
    models[name] = require(path.join(modelDir, file))(sequelize, Sequelize);
  });

  Object.values(models).forEach((model) => model.associate?.(models));

  connection[key] = {
    sequelize,
    models,
    Op,
    transaction: async (callback) => {
      const t = await sequelize.transaction();
      try {
        await callback(t, models);
        await t.commit();
      } catch (e) {
        await t.rollback();
        throw e;
      }
    },
  };

  return connection[key];
};

async function connectCommon() {
  let commonConfig;

  if (config.env === "development") {
    commonConfig = {
      pgsql_url: config.pgsql.host,
      pgsql_port: config.pgsql.port,
      pgsql_user: config.pgsql.user,
      pgsql_password: config.pgsql.password,
      pgsql_database: config.pgsql.common_database,
    };
  } else {
    const secretString = await getDBCred();
    const secrets = JSON.parse(secretString);
    commonConfig = secrets[config.pgsql.common_database];
  }

  const key = "common";
  if (!connection[key]) {
    return await initializeDB({
      key,
      dialect: "postgres",
      host: commonConfig.pgsql_url,
      port: commonConfig.pgsql_port,
      database: commonConfig.pgsql_database,
      username: commonConfig.pgsql_user,
      password: commonConfig.pgsql_password,
      modelDir: path.join(__dirname, "../models/common"),
      ssl: true,
    });
  }

  return connection[key];
}

async function connectClient(dbName) {
  let secrets = {};

  if (config.env === "development") {
    secrets[dbName] = {
      pgsql_url: config.pgsql.host,
      pgsql_port: config.pgsql.port,
      pgsql_user: config.pgsql.user,
      pgsql_password: config.pgsql.password,
      pgsql_database: config.pgsql.database,
      mysql_url: config.mysql.host,
      mysql_port: config.mysql.port,
      mysql_user: config.mysql.user,
      mysql_password: config.mysql.password,
      mysql_database: config.mysql.database,
    };
  } else {
    const secretString = await getDBCred();
    secrets = JSON.parse(secretString);
  }

  const dbConfig = {
    ...secrets[dbName],
    mysql_database: CONFIG[dbName], // optional override
  };

  const connections = {};

  if (dbConfig.pgsql_database) {
    const key = `pgsql_${dbConfig.pgsql_database}`;
    if (!connection[key]) {
      connections.postgres = await initializeDB({
        key,
        dialect: "postgres",
        host: dbConfig.pgsql_url,
        port: dbConfig.pgsql_port,
        database: dbConfig.pgsql_database,
        username: dbConfig.pgsql_user,
        password: dbConfig.pgsql_password,
        modelDir: path.join(__dirname, "../models/psql"),
        ssl: true,
      });
    } else {
      connections.postgres = connection[key];
    }
  }

  if (dbConfig.mysql_database) {
    const key = `mysql_${dbConfig.mysql_database}`;
    if (!connection[key]) {
      connections.mysql = await initializeDB({
        key,
        dialect: "mysql",
        host: dbConfig.mysql_url,
        port: dbConfig.mysql_port,
        database: dbConfig.mysql_database,
        username: dbConfig.mysql_user,
        password: dbConfig.mysql_password,
        modelDir: path.join(__dirname, "../models/mysql"),
      });
    } else {
      connections.mysql = connection[key];
    }
  }

  return connections;
}

/**
 * Get common DB and brand-specific client DBs (Postgres/MySQL)
 * @param {string} clientId
 * @returns {Promise<{ commonDB, postgres, mysql }>}
 */
async function getConnectedDatabases(client_id) {
  const commonDB = await connectCommon();
  const clientInfo = await commonDB.models.e_genie_client.findOne({
    where: { client_id },
    raw: true,
  });
  const dbName = clientInfo?.db_name;
  // console.log("client-info", clientInfo);
  if (!dbName) {
    throw new Error(`DB not found for clientId: ${client_id}`);
  }

  const { postgres, mysql } = await connectClient(dbName);

  return {
    commonDB,
    postgres,
    mysql,
    dbName,
  };
}

module.exports = {
  getConnectedDatabases,
};
