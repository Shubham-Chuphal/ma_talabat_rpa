const { getTalabatBaseUrlForClient } = require("../config/index");

// Middleware to resolve Talabat client config from env JSON by clientId
// Attaches: req.talabatClient = { baseUrl, entityCode, region }
module.exports = function talabatClientConfig(req, res, next) {
  try {
    const clientId = req.query.clientId || req.body?.clientId;
    if (!clientId) return next();

    const { baseUrl, entityCode, region } = getTalabatBaseUrlForClient(clientId);
    req.talabatClient = { baseUrl, entityCode, region, clientId };
  } catch (err) {
    // Do not block the request; just proceed without config
    req.talabatClient = req.talabatClient || {};
  }
  next();
}
