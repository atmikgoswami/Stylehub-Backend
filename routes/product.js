const express = require("express");
const router = express.Router();
const { isLoggedIn, customRole } = require("../middleware/user");

const {
  addProduct,
  getAllProduct,
  adminGetAllProduct,
  getOneProduct,
  adminUpdateOneProduct,
  adminDeleteOneProduct,
  addReview,
  deleteReview,
  getOnlyReviewsPerProduct,
  getStock,
} = require("../controller/productController");

//user routes
router.route("/products").get(getAllProduct);
router.route("/products/:id").get(getOneProduct);
router
  .route("/review")
  .put(isLoggedIn, addReview)
  .delete(isLoggedIn, deleteReview);
router.route("/reviews").get(isLoggedIn, getOnlyReviewsPerProduct);
router.route("/stock").post(isLoggedIn, getStock);

//admin routes
router
  .route("/admin/product/add")
  .post(isLoggedIn, customRole("admin"), addProduct);
router
  .route("/admin/products")
  .get(isLoggedIn, customRole("admin"), adminGetAllProduct);
router
  .route("/admin/product/:id")
  .put(isLoggedIn, customRole("admin"), adminUpdateOneProduct)
  .delete(isLoggedIn, customRole("admin"), adminDeleteOneProduct);

module.exports = router;
