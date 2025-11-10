const express = require("express");
const router = express.Router();
const { authCheck } = require("../../middlewares/errorHandler");

// Import controllers
const campaignController = require("../../controllers/action/campaign");
const keywordController = require("../../controllers/action/keyword");
const productController = require("../../controllers/action/product");
const { fetchTalabatCookies } = require("../../utils/getCookies");

// Campaign routes
router.route("/campaign/edit").post( campaignController.editCampaign);

// Keyword routes
router.route("/keyword/edit").post( keywordController.editKeyword);

// Product routes
router.route("/product/edit").post( productController.editProduct);

// Cookies routes - Test endpoint to manually trigger cookie refresh
router.route("/cookies/refresh").post(async (req, res) => {
  try {
    const clientId = req.body.clientId || req.query.clientId || "M18YZK7J";
    console.log(`Refreshing cookies for clientId: ${clientId}`);
    
    const cookies = await fetchTalabatCookies(clientId);
    
    res.json({
      success: true,
      message: `Cookies refreshed successfully for client ${clientId}`,
      data: cookies,
    });
  } catch (error) {
    console.error("Error refreshing cookies:", error);
    res.status(500).json({
      success: false,
      message: "Failed to refresh cookies",
      error: error.message,
    });
  }
});

module.exports = router;
