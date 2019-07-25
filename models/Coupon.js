/**
 * Module dependencies.
 */
var mongoose = require('mongoose');


// Create a new schema for the reviews collection with all the relevant information for a review
var Schema = mongoose.Schema;

var Coupon = new Schema(
    {
        name: {type: String, required: true},
        discountAmount: {type: Number, Default: 0},
        deliveryDiscountAmount: {type: Number, Default: 0},
        minimumAmount: Number,
        timesUsed: {type: Number, Default: 0},
        expirationDate: {type: Date}
    }
);



var CouponModel = mongoose.model('Coupon', Coupon );


// export the review model
module.exports = CouponModel;