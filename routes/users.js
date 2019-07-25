var express = require('express');
    router = express.Router(),
    ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn,
    userController = require("../controllers/userController.js"),
    User = require("../models/User.js");

var mv = require('mv');

var formidable = require('formidable'),
    fs = require('fs');

/* GET users listing. */
// Get the user profile
router.get('/', ensureLoggedIn('/login'), function(req, res, next) {
    res.render('user', {
        user: req.user,
        userProfile: JSON.stringify(req.user, null, '  ')
    });
});

router.post('/', ensureLoggedIn('/login'), userController.update_data_post);

router.post('/addAddress', ensureLoggedIn('/login'), userController.address_add_post);

router.get('/removeAddress/:index', ensureLoggedIn('/login'), userController.remove_address_get);

router.get('/edit/password', ensureLoggedIn('/login'), function(req, res, next) {
    res.render('users/edit_profile', {
        user: req.user,
        userProfile: JSON.stringify(req.user, null, '  ')
    });
});

router.post('/edit/password', ensureLoggedIn('/login'), userController.password_change_post);


router.get('/purchases', ensureLoggedIn('/login'), function(req, res) {
    User.findById(req.user._id)
        .populate({
            path: 'purchases',
            populate: {
                path: 'supplierID',
                select: { 'name': 1,'_id':1}
            }
        })
        .exec(function (err, user) {
            if (err) return handleError(err);
            res.render('users/purchase_history', {
                user: req.user,
                purchases: user.purchases
            });
    });
});


router.get('/uploadID', ensureLoggedIn('/login'), function(req, res) {
    User.findById(req.user._id)
        .exec(function (err, user) {
            if (err) return handleError(err);
            res.render('user_id_upload', {
                user: req.user,
                purchases: user.purchases
            });
        });
});

router.post('/uploadID', ensureLoggedIn('/login'), function(req, res) {
    User.findById(req.user._id)
        .exec(function (err, user) {
            if (err) return handleError(err);

            var form = new formidable.IncomingForm();
            form.parse(req, function (err, fields, files) {

                var oldpath = files.fileToUpload.path;                         // take old path from users file system
                var temp = Date.now() + files.fileToUpload.name;               // rename file
                var newpath = 'public/upload/' + temp;               // make new path to save the file to the project directory


                if (files.fileToUpload.size > 0) {
                    mv(oldpath, newpath, function(err) {
                        if (err) throw err;
                        user.IDCard = newpath;
                        user.save(function (err, succ) {
                            if (err) return err;
                            res.redirect('/users/uploadID');

                        });
                    });

                }

            });
        });
});

module.exports = router;
