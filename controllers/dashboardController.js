var bodyParser= require("body-parser");
var request = require('request');
var mongoose = require('mongoose');
var exports = {};

var User = require("../models/User");
var Supplier = require("../models/Supplier");

var express = require('express');
var router = express.Router();
var gateway = require('../lib/gateway');

var DeliveryFee = process.env.DELIVERY_COST || 3;
const keyPublishable = process.env.PUBLISHABLE_KEY;
const keySecret = process.env.SECRET_KEY;
const stripe = require("stripe")(keySecret);


exports.supplier_dashboard = function (req, res, next) {
    Supplier.findById(req.user.supplierID).exec(function (err, doc) {
        stripe.charges.list(
            { limit: 3 , stripe_account: doc.stripe_account_id},
            function(err, charges) {
                // asynchronously called
                res.send(charges);
            }
        );
    });
}


module.exports = exports;