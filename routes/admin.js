var express = require('express');
path = require('path'),
    router = express.Router(),
    bodyParser= require('body-parser'),
    formidable = require('formidable'),
    fs = require('fs');

// ensure a user is Logged in and offers redirections
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;

var adminController = require('../controllers/adminController');


var roles = require('../controllers/roleAccess');

// --------------------------
// All the routes have the "/admin"
// path prefixed
// --------------------------

router.get('/', roles.can('access admin page'), adminController.admin_index_get);

router.get('/acceptProduct', roles.can('access admin page'), adminController.admin_accept_product_get);

router.post('/acceptProduct/', roles.can('access admin page'), adminController.admin_accept_product_post);

router.get('/findUser', roles.can('access admin page'), adminController.admin_find_user_get);

router.post('/findUser', roles.can('access admin page'), adminController.admin_find_user_post);

router.get('/viewUser/:id', roles.can('access admin page'), adminController.admin_view_profile_get);

router.get('/makeSupplier', roles.can('access admin page'), adminController.admin_make_supplier_get);

router.post('/makeSupplier/', roles.can('access admin page'), adminController.admin_make_supplier_post);

router.post('/makeSupplier/:id', roles.can('access admin page'), adminController.admin_change_role_post);

router.get('/verifyID', roles.can('access admin page'), adminController.admin_verify_id_get);

router.post('/verifyID', roles.can('access admin page'), adminController.admin_verify_id_post);

router.get('/viewDrivers', roles.can('access admin page'), adminController.admin_view_drivers);

router.post('/viewDrivers', roles.can('access admin page'), adminController.admin_view_drivers_post);

router.get('/viewSuppliers', roles.can('access admin page'), adminController.admin_view_suppliers_get);

router.post('/viewSuppliers', roles.can('access admin page'), adminController.admin_view_suppliers_post);

router.get('/viewCoupons', roles.can('access admin page'), adminController.admin_view_coupons_get);

router.post('/createCoupon', roles.can('access admin page'), adminController.admin_create_coupon_post);

router.post('/deleteCoupon', roles.can('access admin page'), adminController.admin_delete_coupon_post);

module.exports = router;
