const mongoose = require("mongoose"),
    Sale = require("../models/Sale"),
    User = require("../models/User"),
    Driver = require("../models/Driver"),
    formidable = require('formidable'),
    fs = require('fs'),
    mv =  require('mv');

const fetch = require('node-fetch');
const url = require('url');
const URLSearchParams = require('url-search-params');
const stripe = require("stripe")(process.env.SECRET_KEY);
const stripeConnectClientID = process.env.STRIPE_CONNECT_CLIENT_ID;

var driverController = {};

driverController.index_page_get = function(req, res) {
    if (req.user.driverID) {
        Sale.find({driverID: undefined, isVerified: true})
            .populate({
                path: 'supplierID', select: 'address name'
            })
            .exec(function (err, docs) {
                Driver.findById(req.user.driverID, function (err, fDriver) {
                    res.render('driver/driver_index', { user : req.user, driver: fDriver, sales: docs , stripeClientId: stripeConnectClientID});

                });
            })
    } else {
        // Display a form to register as a driver if theres no driver associated to the user
        res.render('driver/driver_index_create', { user : req.user });
    }
};

driverController.register_page_post = function(req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {

        var nDriver = new Driver ({
            telephoneNumber: fields.contactNumber,
            carMaker: fields.carMaker,
            carLicenseNumber: fields.carLicence,
            driverLicenseImage: ''
        });
        // take old path from users file system
        var oldpath = files.fileToUpload.path;
        // rename file
        var temp = Date.now() + files.fileToUpload.name;
        // make new path to save the file to the project directory
        var newpath = 'public/upload/' + temp;

        // change path of file to new path
        mv(oldpath, newpath, function(err) {
                // done. it tried fs.rename first, and then falls back to
                // piping the source file to the dest file and then unlinking
                // the source file.
            if (err) throw err;
            nDriver.driverLicenseImage = newpath;
            // Upload image, if theres no errors add url to image and update Driver's document
            nDriver.save(function (err, driver) {
                if (err) {
                    req.flash('warning', 'There was a problem creating your driver\'s profile');
                    return res.redirect('driver');
                }
                console.log(driver);

                //Save the driver._id to the user in the DB
                User.findById(req.user._id, function (err, foundUser) {
                    if (err) return console.log("couldnt find by ID");
                    foundUser.driverID = driver._id;
                    foundUser.save(function(err, succ) {
                        console.log(succ);
                        res.redirect('/driver/create_stripe_account');

                    });
                });
            });
        });
    });
};

driverController.assign_task_get = function(req, res) {
    var saleID = req.params.id;
    // console.log(saleID);
    Sale.findById(saleID, function (err, sale) {
        if (err) return err;
        sale.driverID = req.user.driverID;
        sale.hasDriver = true;
        Driver.findById(req.user.driverID, function (err, driver) {
           driver.currentJobs.push(sale._id);
           driver.save(function (err, succ) {
               if (err) return err;
           });
        });
        sale.save(function (err, succ) {
           if (err) return err;
           res.redirect('/driver');
        });
    });
};


driverController.create_stripe_account_get = function (req, res) {
    Driver.findById(req.user.supplierID, function (err, fDriver) {
        res.render('driver/stripe_account_form', {user: req.user, driver: fDriver, stripePK: process.env.PUBLISHABLE_KEY});
    })
};


driverController.create_stripe_account_post = function (req, res) {
    var token = req.body.token; // Using Express
    console.log(req.body);
    var account;
    stripe.accounts.create({
        country: "GB",
        type: "custom",
        account_token: token
    }).then(function(acct) {
        // console.log(acct);
        account = acct;
        Driver.findById(req.user.driverID, function(err, fDriver) {
            if (err) return err;
            fDriver.stripe_account_id = acct.id;
            fDriver.save(function (err, nSupplier) {
                console.log("updated driver")
            })
        });
        return (acct);
    }).then(function (account) {
        stripe.accounts.update(account.id, {
            external_account: req.body.bank_token,
            // legal_entity: {
            //     additional_owners: null,
            // }
        }).then(function(acct) {
            console.log(acct);
            // res.send(acct);
            res.redirect('/driver');
        });
    });
};

/*
Current Jobs Page
 */
driverController.my_jobs_page_get = function(req, res) {
    // Do a deep populate to retrieve the supplier's address
    // http://frontendcollisionblog.com/mongodb/2016/01/24/mongoose-populate.html
    Driver.findById(req.user.driverID)
        .populate({
            path: 'currentJobs',
            populate: {
                path: 'supplierID', select: 'address name'
            }
        })
        .populate({
            path: 'currentJobs',
            populate: {
                path: 'buyerID', select: 'name surname DoB telephone1'
            }
        })

        .exec(function (err, driver) {
            // console.log(driver);
            res.render('driver/current_jobs', { user : req.user, driver: driver});
        });
};

driverController.my_jobs_finished_page_get = function(req, res) {
    Driver.findById(req.user.driverID)
        .populate({
            path: 'finishedJobs',
            populate: {
                path: 'supplierID', select: 'address name'
            }
        })
        .populate({
            path: 'finishedJobs',
            populate: {
                path: 'buyerID', select: 'name surname DoB'
            }
        })

        .exec(function (err, driver) {
            // console.log(driver);
            res.render('driver/finished_jobs', { user : req.user, driver: driver});
        });
};

driverController.confirm_delivery_post = function(req, res) {
    console.log("confirm delivery");

    Sale.findById(req.body.salesID, function (err, doc) {
        if (err) return err;
        console.log(doc);
        // if (doc.isDelivered) return res.redirect('/driver/myJobs/current');
        // console.log(doc);
        doc.isDelivered = true;
        doc.deliveryTime = Date.now();
        console.log(doc);

        doc.save().then(function(product) {
            // if (err) return err;
            Driver.update(
                {_id: req.user.driverID},
                {$pull: {currentJobs: doc._id}, $push: {finishedJobs: doc._id}})
                .exec( function (err, uDriver) {
                    if (err) return err;
                });

        }).then(function (value) {
            Driver.findById(req.user.driverID, function (err, fDriver) {
                stripe.transfers.create({
                    amount: process.env.DELIVERY_COST*100,
                    currency: "gbp",
                    destination: fDriver.stripe_account_id,
                    description: "Transfer to driver " + fDriver._id + "",
                    source_transaction: doc.stripeChargeID
                }).then(function(transfer) {
                    // asynchronously called
                    res.redirect('/driver/myJobs/current');
                    console.log(transfer);
                }).catch(function(error) {
                    console.log(error);
                    res.redirect('/driver/myJobs/current');
                });
            });
        });
        // res.send(doc);
    });

};

driverController.profile_page_get = function (req, res) {
  Driver.findById(req.user.driverID, function (err, docs) {
      res.render('driver/view_profile', {user: req.user, driver:docs});
  });
};

driverController.edit_profile_data_post = function (req, res) {

    var errors = [];
    // if (!req.body.sortCode || req.body.sortCode.length !== 6) errors.push("Sort Code must be 6 digits long.");
    // if (req.body.accountNumber.length >= 9) errors.push("Account number must be 8 digits long");
    if (errors.length === 0) {
        Driver.findById(req.user.driverID, function (err, doc) {
            console.log(req.body);
            if (req.body.carMaker) {
                doc.carMaker = req.body.carMaker;
            }
            if (req.body.carLicenseNumber) {
                doc.carLicenseNumber = req.body.carLicenseNumber;
            }
            if (req.body.accountNumber) {
                doc.bankDetails.accountNumber = req.body.accountNumber;
            }
            if (req.body.sortCode) {
                doc.bankDetails.sortCode = req.body.sortCode;
            }
            doc.save(function (err) {
                console.log(doc);
                if (err) return err;
                req.flash("success","Profile updated successfully");
                return res.redirect('/driver/profile');
            })
        });
    } else {
        req.flash("warning","There were errors on the form");
        return res.redirect('/driver/profile');
    }
};



module.exports = driverController;