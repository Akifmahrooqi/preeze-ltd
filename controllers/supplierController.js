const {body,validationResult} = require('express-validator/check');
const {sanitizeBody} = require('express-validator/filter');

const Supplier = require("../models/Supplier");
const Address = require("../models/Address");
const User = require("../models/User");
const Sale = require("../models/Sale");
const Coupon = require("../models/Coupon");
const fetch = require('node-fetch');
const url = require('url');
const URLSearchParams = require('url-search-params');
const stripe = require("stripe")(process.env.SECRET_KEY);
const bodyParser= require("body-parser");

const stripeConnectClientID = process.env.STRIPE_CONNECT_CLIENT_ID;

const TYPES_OF_ALCOHOL = require("../lib/typesOfAlcohol");
const googleMapsClient = require('@google/maps').createClient({
    key: process.env.GMAPS_KEY,
    Promise: Promise
});

var exports = {};

// Display Product create form on GET.
exports.supplier_create_get = function(req, res) {
    // If the user already has a supplier document associated,
    // redirect to the supplier page
    if(req.user.supplierID) return res.redirect("/supplier");

    res.render('supplierCreate', { user : req.user });
};

// Creates a supplier profile for a user
exports.supplier_create_post = function(req, res) {
    // geocode the address to obtain Lat and Long
    googleMapsClient.geocode({address: req.body.houseAndStreet+','+req.body.city+','+req.body.postcode})
    .asPromise()
    .then(function (response) {
        // Store geolocated data in a var
        var resLoc = response.json.results[0].geometry.location;

        // create new address for the Supplier
        var uAddress = new Address({
            houseAndStreet: req.body.houseAndStreet,
            city: req.body.city,
            postcode: req.body.postcode,
            location: {
                coordinates: [resLoc.lng, resLoc.lat]
            }
        });

        // Create new supplier with the address document embedded
        var nSupplier = new Supplier ({
            name: req.body.name,
            address: uAddress,
            location: {
                coordinates: [resLoc.lng, resLoc.lat]
            },
            telephoneNumber: req.body.phoneNumber,
            bankDetails: {
                accountNumber: req.body.accountNumber,
                sortCode: req.body.sortCode
            }
        });

        // save supplier
        nSupplier.save(function (err, newSupplier) {
            if (err) return err;

            // Update user such that it references the new supplier
            User.findById(req.user._id, function (err, fUser) {
                if (err) return err;
                fUser.supplierID = newSupplier._id;
                fUser.save(function (err, succ) {
                    if (err) return err;
                    res.redirect('/supplier/create_stripe_account');
                });
            });
        });
    })
    .catch(function (err) {
        req.flash('error','We couldn\'t find the address.');
        res.redirect('/supplierCreate');

    });
};

// DISPLAY THE INDEX PAGE FOR SUPPLIERS WHICH SHOWS
// A LIST OF THEIR PRODUCTS
exports.supplier_index_get = function(req, res) {
    // Update user such that it references the new supplier
    Supplier.findById(req.user.supplierID, function (err, succ) {
        if (err) return handleError(err);

        res.render('suppliers/supplier', { user : req.user , supplier: succ, stripeClientId: stripeConnectClientID, types_of_alcohol: TYPES_OF_ALCOHOL, platformFee: process.env.PLATFORM_FEE});
    });
};


exports.create_stripe_account_get = function (req, res) {
    Supplier.findById(req.user.supplierID, function (err, fSupplier) {
        res.render('suppliers/stripe_account_form', {user: req.user, supplier: fSupplier, stripePK: process.env.PUBLISHABLE_KEY});
    })
};


exports.create_stripe_account_post = function (req, res) {
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
        Supplier.findById(req.user.supplierID, function(err, fSupplier) {
            if (err) reject(err);
            fSupplier.stripe_account_id = acct.id;
            fSupplier.save(function (err, nSupplier) {
                console.log("updated supplier")
            })
        });
        return (acct);
    }).then(function (account) {
        stripe.accounts.update(account.id, {
            external_account: req.body.bank_token,
            legal_entity: {
                additional_owners: null
            }
        }).then(function(acct) {
            res.redirect('/supplier');
        });
    }).catch(function(e) {
        console.log(e); // 'worky!'
    });
};


/* GET - returns a list of sales that havent been picked up by the drivers
*
 */
exports.supplier_view_current_deliveries = function(req,res) {
    Sale.find({ supplierID: req.user.supplierID, isPickedUp: false, isCanceled: false}, function (err, docs) {
        if (err) return handleError(err);

        res.render('suppliers/current_deliveries', {user: req.user, sales: docs});
    });
};

exports.supplier_confirm_sale_get = function(req, res) {

    new Promise(function(resolve, reject) {
        // RETURN THE NUMBER OF VERIFIED ITEMS TO CREATE AN ORDER IDENTIFIER
        Sale.count({supplierID: req.user.supplierID, isVerified:  true},function(err, numOfDocs) {
            if (err) reject(err);
            resolve(numOfDocs);
        });
    }).then(function(numOfDocs) {
        return new Promise(function(resolve, reject) {
            Sale.findOne({_id : req.params.id})
                .populate('supplierID')
                .exec(function (err, doc) {
                    if (err) return err;
                    if (doc.length < 1) return "hola";
                    var storeIdentifier = doc.supplierID.name.replace(/\s+/g, '');
                    storeIdentifier = storeIdentifier.substring(0,5) + (parseInt(numOfDocs)+1);
                    console.log(storeIdentifier);
                    doc.storeIdentifier = storeIdentifier;
                    doc.isVerified = true;
                    doc.verificationTime = Date.now();

                    doc.save(function (err, nDoc) {
                        if (err) reject(err);
                        res.redirect('../currentSales');
                        resolve(nDoc);
                    });
                });
        });
    }).then(function(confirmedProduct) {
        return new Promise(function(resolve, reject) {
            console.log(confirmedProduct);
            if (confirmedProduct.coupon.name) {
                Coupon.findOne({name: confirmedProduct.coupon.name})
                    .exec(function (err, fCoupon) {
                        fCoupon.timesUsed += 1;
                        fCoupon.save(function (error) {
                        });
                    }
                );
            }
            resolve();
        });
    }).catch(function (reason) {  });
};

exports.supplier_confirm_pickup_get = function(req, res) {
    Sale.findById(req.params.id, function (err, doc) {
        if (err) return err;
        if (doc.length < 1) return "hola";
        if (!doc.hasDriver) return res.redirect('../currentSales');
        doc.isPickedUp = true;
        doc.pickupTime = Date.now();

        doc.save(function (err, nDoc) {
            if (err) return err;
            res.redirect('../currentSales');
        })
    })
};

exports.supplier_sales_view_get = function(req, res) {
    Supplier.findById(req.user.supplierID, function (err, succ) {
        if (err) return handleError(err);
        Sale.find({supplierID: succ._id}, function (err, docs) {
            console.log(docs);
            res.render('suppliers/supplier_view_sales', { user : req.user , supplier: succ, sales: docs});
        });
    });
};

exports.supplier_view_data_get = function (req, res) {
    Supplier.findById(req.user.supplierID, function (err, succ) {
        if (err) return handleError(err);
        res.render('suppliers/edit_data', { user : req.user , supplier: succ});
    });
};

exports.supplier_edit_data_post = function (req, res) {
    console.log(req.body);
    var errors = [];
    // if (!req.body.sortCode || req.body.sortCode.length !== 6) errors.push("Sort Code must be 6 digits long.");
    // if (req.body.accountNumber.length >= 9) errors.push("Account number must be 8 digits long");
    if (errors.length === 0) {
        Supplier.findById(req.user.supplierID, function (err, doc) {
            if (req.body.accountNumber) {
                doc.bankDetails.accountNumber = req.body.accountNumber;
            }
            if (req.body.sortCode) {
                doc.bankDetails.sortCode = req.body.sortCode;
            }
            if(req.body.phoneNumber) {
                doc.telephoneNumber = req.body.phoneNumber;
            }
            doc.save(function (err, succ) {
                if (err) return err;
                return res.redirect('/supplier/viewData');
            })
        });
    }
    console.log(req.body.sortCode.length);
    console.log(errors);
    // res.redirect('/supplier/viewData');
};


module.exports = exports;