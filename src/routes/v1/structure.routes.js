const express = require("express");
const router = express.Router();
const { campaignStructure } = require("../../controllers/structure.controller");
const { asyncHandler } = require("../../utils/requestHandler");

router.post("/campaigns", asyncHandler(campaignStructure));

module.exports = router;
