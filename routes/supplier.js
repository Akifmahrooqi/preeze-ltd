var express = require('express');
path = require('path'),
    router = express.Router(),
    bodyParser= require('body-parser'),
    formidable = require('formidable'),
    fs = require('fs');

// ensure a user is Logged in and offers redirections
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;

var initDB= require('../controllers/init');
var passport = require("passport");

var auth = require("../controllers/userController.js");
var roles = require('../controllers/roleAccess');
var productController = require('../controllers/productController');
var supplierController = require('../controllers/supplierController');
var driverController = require('../controllers/driverController');
var saleController = require('../controllers/saleController');


router.get('/', roles.can('access supplier page'), supplierController.supplier_index_get);

// router.get('/stripe_redirect', roles.can('access supplier page'), supplierController.stripe_redirect);

router.get('/create_stripe_account', roles.can('access supplier page'), supplierController.create_stripe_account_get);

router.post('/create_stripe_account', roles.can('access supplier page'), supplierController.create_stripe_account_post);

router.get('/sortAscending', roles.can('access supplier page'), productController.products_sort_get);

router.get('/viewData', roles.can('access supplier page'), supplierController.supplier_view_data_get);

router.post('/editData', roles.can('access supplier page'), supplierController.supplier_edit_data_post);

router.get('/viewSales', roles.can('access supplier page'), supplierController.supplier_sales_view_get);

router.get('/currentSales', roles.can('access supplier page'), supplierController.supplier_view_current_deliveries);

router.get('/verifyOrder/:id', roles.can('access supplier page'), supplierController.supplier_confirm_sale_get);

router.get('/confirmPickup/:id', roles.can('access supplier page'), supplierController.supplier_confirm_pickup_get);

router.get('/cancelAndRefund/:id', roles.can('access supplier page'), saleController.cancel_and_refund_sale_get);


router.post('/restock', roles.can('access supplier page'), productController.product_restock_post);

router.get('/addProduct', roles.can('access supplier page'), productController.product_create_get);

router.post('/addProduct', roles.can('access supplier page'), productController.product_create_post);

router.get('/:id/edit', roles.can('access supplier page'), productController.product_edit_get);

router.get('/:id/delete/', roles.can('access supplier page'), productController.product_delete_get);

router.post('/:id/edit', roles.can('access supplier page'), productController.product_edit_post);

module.exports = router;

