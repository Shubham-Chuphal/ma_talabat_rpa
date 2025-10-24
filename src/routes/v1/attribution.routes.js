const express = require("express");
const router = express.Router();
const { asyncHandler } = require("../../utils/requestHandler");
const {
  populateAttribution,
} = require("../../controllers/attribution.controller");

router.post("/populate", asyncHandler(populateAttribution));

module.exports = router;
