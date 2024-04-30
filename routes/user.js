const express = require('express');
const router = express.Router();

const {signup, login, logout, getCartItems, addCartItem, } = require('../controller/userController');
const { isLoggedIn } = require('../middleware/user');

router.route('/signup').post(signup);
router.route('/login').post(login);
router.route('/logout').get(logout);
router.route('/cart').get(isLoggedIn, getCartItems);
router.route('/cart/add').post(isLoggedIn, addCartItem);

module.exports = router;