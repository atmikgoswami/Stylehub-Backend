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
} = require("../controller/userController");
const { isLoggedIn, customRole } = require("../middleware/user");

router.route("/signup").post(signup);
router.route("/login").post(login);
router.route("/logout").get(logout);
router.route("/cart").get(isLoggedIn, getCartItems);
router.route("/cart/add").post(isLoggedIn, addCartItem);
router.route("/userdashboard/update").post(isLoggedIn, updateUserDetails);
router.route("/userdashboard").get(isLoggedIn, getLoggedInUserDetails);

//admin routes
router
  .route("/admin/users")
  .get(isLoggedIn, customRole("admin"), adminAllUsers);

module.exports = router;
