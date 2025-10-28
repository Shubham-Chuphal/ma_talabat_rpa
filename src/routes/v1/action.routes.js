const express = require("express");
const router = express.Router();
const { authCheck } = require("../../middlewares/errorHandler");

// Import controllers
const campaignController = require("../../controllers/action/campaign");
const keywordController = require("../../controllers/action/keyword");
const productController = require("../../controllers/action/product");

// Campaign routes
router.route("/campaign/edit").post( campaignController.editCampaign);

// Keyword routes
router.route("/keyword/edit").post( keywordController.editKeyword);

// Product routes
router.route("/product/edit").post( productController.editProduct);

module.exports = router;
