var mongoose = require("mongoose"),
    passport = require("passport"),
    User = require("../models/User"),
    passportLocalMongoose = require('passport-local-mongoose'),
    Address = require("../models/Address"),
    bodyParser= require("body-parser");
const { promisify } = require('util');
const crypto = require('crypto');

const randomBytesAsync = promisify(crypto.randomBytes);
var sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

var googleMapsClient = require('@google/maps').createClient({
    key: process.env.GMAPS_KEY,
    Promise: Promise
});

var userController = {};

// Restrict access to root page
userController.home = function(req, res) {
    res.render('index', { user : req.user });
};

userController.update_data_post = function(req, res) {
    User.findById(req.user._id, function (err, user) {
        if (req.body.name) {
            user.name = req.body.name;
        }
        if (req.body.surname) {
            user.surname = req.body.surname;
        }
        if (req.body.DoB) {
            user.DoB = req.body.DoB;
        }
        if (req.body.telephone) {
            user.telephone1 = req.body.telephone;
        }
        if (req.body.houseAndStreet && req.body.postcode && req.body.city) {
            user.billingAddress.houseAndStreet = req.body.houseAndStreet;
            user.billingAddress.postcode = req.body.postcode;
            user.billingAddress.city = req.body.city;
        }
        user.save(function (err, succ) {
            if (err) return err;
            res.redirect('/users')
        })
    });
};

// Go to registration page
userController.register = function(req, res) {
    res.render('register', { user : req.user , errors : []  });
};

userController.address_add_post = function(req, res) {
    var combinedAddress = "" + req.body.houseAndStreet + ", " +req.body.city + ", " + req.body.postcode;
    if (combinedAddress === ", , ") {
        req.flash('warning', "Address can't be empty");
        return res.redirect("/users");
    }
    googleMapsClient.geocode({address: combinedAddress})
        .asPromise()
        .then(storeAddress)
        .catch(function(err) {
            console.log(err);
        });
    function storeAddress (response) {
        var resLoc = response.json.results[0].geometry.location;

        var uAddress = new Address({
            houseAndStreet: req.body.houseAndStreet,
            city: req.body.city,
            postcode: req.body.postcode.toUpperCase(),
            location: {
                coordinates: [resLoc.lng, resLoc.lat]
            }
        });

        User.update(
            {_id: req.user._id},
            {$push: {deliveryAddress: uAddress}},
            function (err, user) {
                if (err) return err;
                console.log(user);
                if (req.body.fromPage === "cart") {
                    res.redirect("/cart/checkout");
                } else {
                    res.redirect("/users");
                }
            });
    }
};

userController.remove_address_get = function (req, res) {
    const index = req.params.index;

    User.findById(req.user._id, function (err, fUser) {
        if (err) return console.log(err);
        console.log(fUser);
        console.log(req.params.index);
        console.log(fUser.deliveryAddress[req.params.index]);
        if (index > -1) {
            fUser.deliveryAddress.splice(index, 1);
        }
        fUser.save(function (err, sUser) {
            if (err) return console.log(err);
            req.flash('success', 'The address was removed');
            return res.redirect('/users');
        })
    });
};

// Post registration
userController.doRegister = function(req, res) {
    /* ----------
    Validation
    ------------ */
    var errors = [];
    if (!req.body.name || req.body.name === "") errors.push("Name field can't be empty");
    if (!req.body.surname || req.body.surname === "") errors.push("Surname field can't be empty");
    if (!req.body.bday) errors.push("Date of Birth field can't be empty");
    if (!req.body.password || req.body.password === "") errors.push("Password field can't be empty");
    if (!req.body.password2 || req.body.password2 === "") errors.push("Password field can't be empty");
    if (req.body.password !== req.body.password2) errors.push("Passwords dont match");
    if (!req.body.houseAndStreet || req.body.houseAndStreet === "") errors.push("House and Street field can't be empty");
    if (!req.body.city || req.body.city === "") errors.push("City field can't be empty");
    if (!req.body.postcode || req.body.postcode === "") errors.push("Postcode field can't be empty");
    if (!req.body.username || req.body.username === "") errors.push("Username field can't be empty");
    if (errors.length > 0) return res.render('register', { user : req.user, errors: errors });

    var combinedAddress = "" + req.body.houseAndStreet + ", " +req.body.city + ", " + req.body.postcode;
    console.log("-----------");
    console.log("Doing geocoding");
    console.log("-----------");
    googleMapsClient.geocode({address: combinedAddress})
        .asPromise()
        .then(function(response) {
            var resLoc = response.json.results[0].geometry.location;

            var uAddress = new Address({
                houseAndStreet: req.body.houseAndStreet,
                city: req.body.city,
                postcode: req.body.postcode.toUpperCase(),
                location: {
                    coordinates : [resLoc.lng, resLoc.lat]
                }
            });

            User.register(new User({ username : req.body.username, name: req.body.name, surname: req.body.surname, telephone1: req.body.telephone, DoB: req.body.bday, billingAddress: uAddress, deliveryAddress:[uAddress] }), req.body.password, function(err, user) {
                console.log(user);
                if (err) {
                    co
                    return res.redirect('/register');
                }
                passport.authenticate('local')(req, res, function () {
                    res.redirect('/');
                });
            });
        })
        .catch(function(err) {
            User.register(new User({ username : req.body.username, name: req.body.name, surname: req.body.surname, telephone1: req.body.telephone, DoB: req.body.bday, billingAddress: null, deliveryAddress:[]}), req.body.password, function(err, user) {
                if (err) {
                    console.log(err);
                    req.flash('error', 'There was an error creating your profile, please try again.');
                    return res.render('register', { user : user });
                }
                passport.authenticate('local')(req, res, function () {
                    req.flash('error', 'We couldn\'t geolocate your address. You will have to add it manually form the profile page.');
                    res.redirect('/');
                });
            });
        });


};

/* ------------------
Change Password POST
------------------ */
userController.password_change_post = function(req, res) {
    console.log(req.body);
    if(req.body.newPassword1 !== req.body.newPassword2) {
        req.flash('warning', 'The passwords didn\'t match');
        res.redirect('/users/edit/password');
    }
    User.findByUsername(req.user.username).then(function(user) {
        // if (err) return console.error(err);
        if(!user) return reject(res.send("couldnt find user"));
        console.log(user);
        user.changePassword(req.body.oldPassword, req.body.newPassword1, function(err) {
            if (err) return err;
            user.save();
            req.flash('success', 'The password was updated');
            res.redirect('/users/edit/password');
        })
    })
    .catch(function(err) {
        console.log(err);
    })
};

// Go to login page
userController.login = function(req, res) {
    console.log("entered login page");
    res.render('login');
};

// Post login
userController.login_post =  function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
        if (err) { return next(err); }
        if (!user) { req.flash('danger', 'No user was found, check your credentials'); return res.redirect('/login'); }
        req.logIn(user, function(err) {
            if (err) { return next(err); }
            return res.redirect('/');
        });
    })(req, res, next), function(err) {
        req.flash('danger', err);
        return res.redirect('/login');
    };
};




// logout
userController.logout = function(req, res) {
    req.logout();
    res.redirect('/');
};

userController.splash_get = function (req, res) {
    console.log("algo");
    res.render('splashScreen', {user: req.user});
};


// CODE FOR PASSWORD RECOVERY
/**
 * GET /reset/:token
 * Reset Password page.
 */
userController.getReset = (req, res, next) => {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    User.findOne({ passwordResetToken: req.params.token })
        .where('passwordResetExpires').gt(Date.now())
        .exec(function (err, user) {
            if (err) { return next(err); }
            if (!user) {
            req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
            return res.redirect('/forgot');
        }
        res.render('users/reset', {
            title: 'Password Reset',
            user: req.user
        });
    });
};

/**
 * POST /reset/:token
 * Process the reset password request.
 */
userController.postReset = function(req, res, next) {
    req.assert('password', 'Password must be at least 4 characters long.').len(4);
    req.assert('confirm', 'Passwords must match.').equals(req.body.password);

    const errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('back');
    }

    const resetPassword = () =>
    User
        .findOne({ passwordResetToken: req.params.token })
        .where('passwordResetExpires').gt(Date.now())
        .then(function(user) {
            if (!user) {
            req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
            return res.redirect('back');
        }
        user.password = req.body.password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        return user.save().then(() => new Promise((resolve, reject) => {
            req.logIn(user, (err) => {
            if (err) { return reject(err); }
            resolve(user);
        });
        }));
    });

    const sendResetPasswordEmail = (user) => {
        if (!user) { return; }
        const mailOptions = {
            to: user.email,
            from: 'no-reply@preeze.co.uk',
            subject: 'Your Preeze.co.uk  password has been changed',
            html: "<p>Hello,</p><p>This is a confirmation that the password for your account "+user.email+" has just been changed.</p>"
        };
        return sgMail.send(mailOptions).then(function (value) {
            req.flash('success', { msg: 'Success! Your password has been changed.'
            });
    })
    .catch(function (err) {
        console.log('ERROR: Could not send password reset confirmation email after security downgrade.\n', err);
        req.flash('warning', { msg: 'Your password has been changed, however we were unable to send you a confirmation email. We will be looking into it shortly.' });
        return err;
    });
    };

    resetPassword()
    .then(sendResetPasswordEmail)
    .then(function() { if (!res.finished) res.redirect('/'); })
    .catch(function (err){ next(err)});
};

/**
 * GET /forgot
 * Forgot Password page.
 */
userController.getForgot = (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    res.render('users/forgot', {
        title: 'Forgot Password',
        user : req.user
    });
};

/**
 * POST /forgot
 * Create a random token, then the send user an email with a reset link.
 */
userController.postForgot = function (req, res, next) {
    req.assert('forgotEmail', 'Please enter a valid email address.').isEmail();
    req.sanitize('forgotEmail').normalizeEmail({ gmail_remove_dots: false });

    const errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        console.log(errors);
        return res.redirect('/forgot');
    }

    const createRandomToken = randomBytesAsync(16)
        .then(buf => buf.toString('hex'));

    const setRandomToken = token =>
    User
        .findOne({ username: req.body.forgotEmail })
        .then(function(user) {
            if (!user) {
                req.flash('errors', {msg: 'Account with that email address does not exist.'});
            } else {
                user.passwordResetToken = token;
                user.passwordResetExpires = Date.now() + 3600000; // 1 hour
                user = user.save();
                console.log("founduser");
            }
            return user;
        });


    const sendForgotPasswordEmail = (user) => {
        if (!user) { return; }
        const token = user.passwordResetToken;
        const mailOptions = {
            to: user.username,
            from: 'no-reply@preeze.co.uk',
            subject: 'Reset your password on Preeze.co.uk',
            html: '<p>You are receiving this email because you (or someone else) have requested the reset of the password for your account.</p>'+
            '<p>Please click on the following link, or paste this into your browser to complete the process:</p>'+
            '<p><a href="https://preeze.co.uk/reset/'+token+'">https://preeze.co.uk/reset/'+token+'</p></a>'+
            '<p>If you did not request this, please ignore this email and your password will remain unchanged.</p>'
        };

        sgMail.send(mailOptions).then(function (value) {
            console.log("doflash");

            req.flash('success', 'An e-mail has been sent to '+user.email+' with further instructions.');
        })
        .catch(function(err) {
            req.flash('errors', 'Error sending the password reset message. Please try again shortly.');
            return err;
        });
    }
    createRandomToken
    .then(setRandomToken)
    .then(sendForgotPasswordEmail)
    .then(function() { res.redirect('/forgot')})
    .catch(function (err) {
        console.log(err);
    })
}

module.exports = userController;