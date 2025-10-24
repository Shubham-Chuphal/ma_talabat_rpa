const express = require("express");
const router = express.Router();
const { authCheck } = require("../../middlewares/errorHandler");

// Import controllers
const campaignController = require("../../controllers/action/campaign");
const keywordController = require("../../controllers/action/keyword");
const productController = require("../../controllers/action/product");

// Campaign routes
router.route("/campaign/edit").post(authCheck, campaignController.editCampaign);

// Keyword routes
router.route("/keyword/edit").post(authCheck, keywordController.editKeyword);

// Product routes
router.route("/product/edit").post(authCheck, productController.editProduct);

module.exports = router;
