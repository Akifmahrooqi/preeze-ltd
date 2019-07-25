var bodyParser= require("body-parser");
var request = require('request');
var mongoose = require('mongoose');
var exports = {};

var User = require("../models/User");
var Sale = require("../models/Sale");
var Supplier = require("../models/Supplier");
var Coupon = require("../models/Coupon");

var express = require('express');
var router = express.Router();
var gateway = require('../lib/gateway');

var DeliveryFee = process.env.DELIVERY_COST || 3;
const keyPublishable = process.env.PUBLISHABLE_KEY;
const keySecret = process.env.SECRET_KEY;
const stripe = require("stripe")(keySecret);


exports.coupon_clear_get = function(req, res) {
    delete req.session.coupon;
    req.flash('success', 'Coupon removed');
    res.redirect('/cart/checkout');
};

exports.cart_add_coupon_post = function (req, res) {
    var total = 0;
    var theCoupon;

    var findTheCoupon = function() {
        var promise = new Promise(function(resolve, reject){
            Coupon.find({name : req.body.couponCode}, 'name discountAmount deliveryDiscountAmount minimumAmount',function (err, coupon) {
                if (err) reject(err);
                if (coupon.length === 0) reject("That coupon doesn't exist");
                theCoupon = coupon;
                resolve(coupon);
            });
        });
        return promise;
    };

    var hasItBeenRedeemed = function(coupon) {
        var promise = new Promise(function(resolve, reject){
            User.findById(req.user._id,function (err, user) {
                //Check if coupon has been used by the client
                if (user.usedCoupons.indexOf(coupon[0]._id) != -1) reject("That coupon has already been redeemed");
                if (err) reject(err);
                resolve(user);
            });
        });
        return promise;
    };

    var doTheMagic = function(user) {
        var promise = new Promise(function(resolve, reject){
            console.log(user);
            req.session.cart.forEach(function (item) {
                console.log(item);
                total += parseFloat(item.qty) * parseFloat(item.price);
            });
            console.log(total);
            console.log(theCoupon[0].minimumAmount);
            if (total >= parseFloat(theCoupon[0].minimumAmount)) {
                req.session.coupon = theCoupon;
                console.log(req.session.coupon);
                req.flash('success', 'Coupon applied successfully');
                res.redirect('/cart/checkout');
                resolve();
            } else {
                reject('The minimum order to apply this coupon is £' + theCoupon[0].minimumAmount);
                // req.flash('warning', 'The minimum order to apply this coupon is ' + theCoupon[0].minimumAmount);
            }
        });
        return promise;
    };

    return findTheCoupon()
        .then(hasItBeenRedeemed)
        .then(doTheMagic)
        .catch(function (err) {
            console.log(err);
            req.flash('warning', err);
            return res.redirect('/cart/checkout');
        });
};


module.exports = exports;