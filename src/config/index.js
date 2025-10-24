require("dotenv").config();
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");
let talabatClients = {};
try {
  const clientsStr = process.env.TALABAT_CONFIG_BASED_CLIENT || "{}";
  talabatClients = JSON.parse(clientsStr);
} catch (e) {
  console.error("Invalid TALABAT_CONFIG_BASED_CLIENT JSON in env", e);
  talabatClients = {};
}

const config = {
  port: process.env.PORT || 5000,
  local_development: process.env.LOCAL_DEV_MODE === "true",
  env: process.env.NODE_ENV || "development",
  apiDebug: process.env.DEBUG_API_RESPONSES === "true",
  // pgsql_common

  aws: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || "ap-south-1",
  },

  talabat: {
    accessKey: process.env.TALABAT_ACCESS_KEY,
    secretKey: process.env.TALABAT_SECRET_KEY,
    // loaded from env
    clients: talabatClients,
  },

  mysql: {
    database: process.env.mysql_database,
    user: process.env.mysql_user,
    password: process.env.mysql_password,
    port: process.env.mysql_port,
    host: process.env.mysql_url,
  },

  pgsql: {
    common_database:
      process.env.NODE_ENV === "development"
        ? process.env.pgsql_common
        : process.env.prod_common_db,
    database: process.env.pgsql_database,
    user: process.env.pgsql_user,
    password: process.env.pgsql_password,
    port: process.env.pgsql_port,
    host: process.env.pgsql_url,
  },
};

// Async function to fetch DB credentials dynamically from AWS Secrets Manager
async function getDBCred(secretName = "database_prod") {
  const client = new SecretsManagerClient({
    region: config.aws.region,
    credentials: {
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
    },
  });

  try {
    const response = await client.send(
      new GetSecretValueCommand({ SecretId: secretName })
    );

    if ("SecretString" in response) {
      return response.SecretString;
    } else {
      let buff = Buffer.from(response.SecretBinary, "base64");
      return buff.toString("ascii");
    }
  } catch (error) {
    console.error("Failed to retrieve secret:", error.message);
    throw error;
  }
}

/**
 * Resolve Talabat BASE_URL + ENTITY_CODE for a given client.
 *
 * Env: TALABAT_CONFIG_BASED_CLIENT = JSON like:
 * {
 *   "M18YZK7J": { "REGION": "UAE", "ENTITY_CODE": "TB_AE", "BASE_URL": "https://qcat-dsp-me.deliveryhero.io/api/v1/entities/" },
 *   "Q77XYL9K": { "REGION": "QATAR", "ENTITY_CODE": "TB_QA", "BASE_URL": "https://qcat-dsp-me.deliveryhero.io/api/v1/entities/" }
 * }
 */
function getTalabatBaseUrlForClient(clientId) {
  const cid = String(clientId || "");
  const clients = config.talabat.clients || {};

  // 1) Lookup client directly from env JSON
  const clientCfg = clients[cid];
  if (clientCfg && clientCfg.BASE_URL && clientCfg.ENTITY_CODE) {
    return {
      baseUrl: ensureTrailingSlash(clientCfg.BASE_URL),
      entityCode: clientCfg.ENTITY_CODE,
      region: clientCfg.REGION || "",
    };
  }

  // 2) Fall back to global API base URL from config
  return {
    baseUrl: ensureTrailingSlash(config.talabat.apiUrl),
    entityCode: "",
    region: "",
  };
}

function ensureTrailingSlash(url) {
  if (!url) return "/";
  return url.endsWith("/") ? url : url + "/";
}

module.exports = {
  config,
  getDBCred,
  getTalabatBaseUrlForClient,
};
