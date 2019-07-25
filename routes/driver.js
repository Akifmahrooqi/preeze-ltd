var express = require('express');
var path = require('path'),
    router = express.Router(),
    bodyParser= require('body-parser'),
    formidable = require('formidable');
var fs = require('fs');

const driverController = require('../controllers/driverController');
const roles = require('../controllers/roleAccess');


router.get('/', roles.can('access driver page'), driverController.index_page_get);

router.get('/profile', roles.can('access driver page'), driverController.profile_page_get);

router.post('/editData', roles.can('access driver page'), driverController.edit_profile_data_post);

// router.get('/stripe_redirect', roles.can('access driver page'), driverController.stripe_redirect_driver);

router.get('/create_stripe_account', roles.can('access driver page'), driverController.create_stripe_account_get);

router.post('/create_stripe_account', roles.can('access driver page'), driverController.create_stripe_account_post);

// Displays the driver's current jobs
router.get('/myJobs/current', roles.can('access driver page'), driverController.my_jobs_page_get);

// Marks a sale as completed
router.post('/myJobs/current/confirmDelivery', roles.can('access driver page'), driverController.confirm_delivery_post);

router.get('/myJobs/finished', roles.can('access driver page'), driverController.my_jobs_finished_page_get);

router.post('/registerDriver', roles.can('access driver page'), driverController.register_page_post);

router.get('/assignTask/:id', roles.can('access driver page'), driverController.assign_task_get);

module.exports = router;
