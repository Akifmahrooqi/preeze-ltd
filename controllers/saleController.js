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


/* GET /cancelAndRefund/:id
-----------------------------------------
set a sale as canceled and call stripe API
to refund the money to the customer
 */
exports.cancel_and_refund_sale_get = function (req, res) {
    var findSale = new Promise(function(resolve, reject) {
        Sale.findById(req.params.id, function (err, fSale) {
            fSale.isCanceled = true;
            fSale.canceledTime = Date.now();

            fSale.save(function (err) {
                if (err) reject(err);
                return resolve(fSale.stripeChargeID);
            })
        });
    });

    findSale.then(function(stripeChargeID) {
        stripe.refunds.create({
            charge: stripeChargeID
        }, function (err, refund) {
            res.redirect("/supplier/currentSales");
        });
    });
};

module.exports = exports;