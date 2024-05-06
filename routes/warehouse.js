const express = require("express");
const router = express.Router();
const { isLoggedIn, customRole } = require("../middleware/user");

const { addWarehouse } = require("../controller/warehouseController");

//admin routes
router
  .route("/warehouse/add")
  .post(isLoggedIn, customRole("admin"), addWarehouse);

module.exports = router;
