var express = require('express'),
    path = require('path'),
    router = express.Router(),
    bodyParser= require('body-parser'),
    formidable = require('formidable'),
    fs = require('fs');

// ensure a user is Logged in and offers redirections
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;

var passport = require("passport");

var cartController = require("../controllers/cartController.js");
var couponController = require("../controllers/couponController.js");

router.get('/checkout', cartController.cart_checkout_get);


router.post('/charge', cartController.stripe_checkout_post);

router.get('/checkout/:id', cartController.cart_checkout_success_get);

router.get('/add/:supplier/:item', cartController.product_add_get);

router.get('/clear', cartController.cart_clear_get);

router.get('/update/:product', cartController.cart_update_get);

router.post('/coupon', couponController.cart_add_coupon_post);

router.get('/clearCoupon', couponController.coupon_clear_get);

module.exports = router;

