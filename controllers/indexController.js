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
const platformFee = process.env.PLATFORM_FEE;

const TYPES_OF_ALCOHOL = require("../lib/typesOfAlcohol");

const googleMapsClient = require('@google/maps').createClient({
    key: process.env.GMAPS_KEY,
    Promise: Promise
});

var exports = {};


// Displays the index page on GET request
exports.index_page_get_old = function(req, res) {
    console.log(process.env.DB_HOST);
    res.render('index', { user : req.user , foundSuppliers: null, postCode: null,totalSuppliers: null, types_of_alcohol: TYPES_OF_ALCOHOL});
};

/* This route is used to check the users role and redirect him to
 * a certain page when he visits the root url preeze.co.uk/
 * Drivers - Redirected to currentJobs or createDriverAccount page
 * Others - Get redirected to /index
 */
exports.index_page_user_check = function(req, res, next) {
    if (req.user.role === "driver" || req.user.role==="admin") {
        if (req.user.driverID) {
            res.redirect("/driver/myJobs/current");
        } else {
            res.redirect("/driver");
        }
    } else {
        next();
    }
};

// Displays supplier results in the index page
// after a POST request
exports.index_page_get = function(req, res, next) {
    // console.log(req.body);
    // console.log(req.body);
    // console.log(req.params);
    // console.log(req.query);
    if (!req.query.postcode) {
        return res.render('index', { user : req.user , foundSuppliers: null, postCode: null,totalSuppliers: null, types_of_alcohol: TYPES_OF_ALCOHOL});
    }
    var page = req.query.page || 0;

    if (req.query.postcode == null || req.query.postcode === '') return res.render('index', { user : req.user, foundSuppliers: null, postCode: null, totalSuppliers: null, types_of_alcohol: TYPES_OF_ALCOHOL});

    if (req.query.coords_lat || req.query.coords_lon) {
        // console.log(req.body.coords_lat + " / " + req.body.coords_lon)
    }

    // Geocode an address.
    googleMapsClient.geocode({address: req.query.postcode})
        .asPromise()
        .then(function(response) {
            // console.log(response.json.results);

            // Store the geocoded location in a varibale {lat, lng}
            var resLoc = response.json.results[0].geometry.location;

            var query = Supplier.find({
                "stripe_account_id": { $exists: true, $ne: null },
                location: {
                    $nearSphere: {
                        $geometry: {
                            type : "Point",
                            coordinates : [resLoc.lng, resLoc.lat]
                        },
                        // $minDistance: 1,   // metres
                        $maxDistance: process.env.SEARCH_RADIUS // metres
                    }
                }
            });

            query.exec(function (err, data) {
                // console.log("executed geoquery");
                if (err) {
                    // console.log(err);
                    req.flash('error', err);
                    return res.redirect('/');
                }
                if (!data || data.length == 0) {
                    // console.log("no data found");
                    req.flash('warning', 'We couldn\'t find any suppliers in your area');
                    res.render('index', {
                        user : req.user,
                        foundSuppliers : data[page],
                        totalSuppliers: false,
                        postCode: req.query.postcode,
                        platformFee: platformFee,
                        types_of_alcohol: TYPES_OF_ALCOHOL
                    });
                } else {
                    //console.log(data);
                    res.render('index', {
                        user : req.user,
                        foundSuppliers : [data[page]],
                        totalSuppliers : data,
                        postCode: req.query.postcode,
                        platformFee: platformFee,
                        types_of_alcohol: TYPES_OF_ALCOHOL
                    });
                }

            });

        })
        .catch(function (err) {
            // console.log(err);
            req.flash('error', 'Invalid address!');
            res.redirect('/');
        });
};

module.exports = exports;