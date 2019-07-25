var express = require('express');
    path = require('path'),
    router = express.Router(),
    bodyParser= require('body-parser'),
    formidable = require('formidable'),
    fs = require('fs');

// ensure a user is Logged in and offers redirections
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;

var initDB= require('../controllers/init');

var userController = require("../controllers/userController.js");
var roles = require('../controllers/roleAccess');
var supplierController = require('../controllers/supplierController');
var indexController = require('../controllers/indexController');

// initDB.init();

//-------------------
// This routes make the splash-screen not work.
//-------------------
router.get('/', indexController.index_page_get);
router.get('/index', indexController.index_page_get);
//-------------------
// This routes turn on the splashpage.
//-------------------
// router.get('/', ensureLoggedIn('/splash'), indexController.index_page_user_check, indexController.index_page_get);
// router.get('/index', ensureLoggedIn('/splash'), indexController.index_page_get);
//-------------------

// router.post('/', indexController.index_page_post);

router.get('/splash', userController.splash_get);

router.get('/supplierCreate', roles.can('access supplier page'), supplierController.supplier_create_get);

router.post('/supplierCreate', roles.can('access supplier page'), supplierController.supplier_create_post);


router.get('/fUpload', function (req, res){
    res.render('testFileUpload', { user : req.user });
});

router.post('/fUpload', function (req, res){
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        // take old path from users file system
        var oldpath = files.fileToUpload.path;
        // rename file
        var temp = Date.now() + files.fileToUpload.name;
        // make new path to save the file to the project directory
        var newpath = './public/images/uploads/' + temp;
        // var newpath = __dirname + '/public/uploads/' + temp;
        // change path of file to new path
        console.log(fields);

        // fs.rename(oldpath, newpath, function (err) {
        //     if (err) throw err;
        //     res.render('testFileUpload', { user : req.user });
        // });
        res.render('testFileUpload', { user : req.user });

    });
});


// route to register page
router.get('/register', userController.register);

// route for register action
router.post('/register', userController.doRegister);

// route to login page
router.get('/login', userController.login);

// route for login action
router.post('/login', userController.login_post);

// route for logout action
router.get('/logout', userController.logout);

router.get('/forgot', userController.getForgot);
router.post('/forgot', userController.postForgot);
router.get('/reset/:token', userController.getReset);
router.post('/reset/:token', userController.postReset);

module.exports = router;

