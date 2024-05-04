const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  logout,
  getCartItems,
  addCartItem,
  updateUserDetails,
  getLoggedInUserDetails,
  adminAllUsers,
  addAddress,
  updateaddress,
  deleteaddress,
  deleteCartItem,
} = require("../controller/userController");
const { isLoggedIn, customRole } = require("../middleware/user");

router.route("/signup").post(signup);
router.route("/login").post(login);
router.route("/logout").get(logout);
router
  .route("/cart")
  .get(isLoggedIn, getCartItems)
  .post(isLoggedIn, addCartItem)
  .delete(isLoggedIn, deleteCartItem);
router
  .route("/shippinginfo")
  .post(isLoggedIn, addAddress)
  .put(isLoggedIn, updateaddress)
  .delete(isLoggedIn, deleteaddress);
router.route("/userdashboard/update").post(isLoggedIn, updateUserDetails);
router.route("/userdashboard").get(isLoggedIn, getLoggedInUserDetails);

//admin routes
router
  .route("/admin/users")
  .get(isLoggedIn, customRole("admin"), adminAllUsers);

module.exports = router;
