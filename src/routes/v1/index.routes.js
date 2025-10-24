const express = require("express");
const router = express.Router();
const { healthCheck } = require("../../controllers/health.controller");
const { asyncHandler } = require("../../utils/requestHandler");

router.get("/health", asyncHandler(healthCheck));
router.use("/attribution", require("./attribution.routes"));
router.use("/structure", require("./structure.routes"));
router.use("/action", require("./action.routes"));

module.exports = router;
