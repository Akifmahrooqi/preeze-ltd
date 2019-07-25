/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Address = require('./Address.js'),
    AddressSchema = mongoose.model('Address').schema;
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

// Create a new schema for the users collection with all the relevant information for a user
var User = new Schema({
    username: String,
    password: String,
    passwordResetToken: String,
    passwordResetExpires: Date,

    role: {type: String, default: 'user'},
    supplierID: {type: Schema.Types.ObjectId, ref: 'Supplier'},
    driverID: {type: Schema.Types.ObjectId, ref: 'Driver'},

    name: String,
    surname: String,
    telephone1: String,
    DoB: Date,
    billingAddress: AddressSchema,
    deliveryAddress: [AddressSchema],
    IDCard: String,
    isIDVerified: {type: Boolean, default: false},

    purchases: [{type: Schema.Types.ObjectId, ref: "Sale"}],
    usedCoupons: [{type: Schema.Types.ObjectId, ref: "Coupon"}],
    stripeCustomerID: String
});

// passport plugin
User.plugin(passportLocalMongoose);

User.methods.changePassword = function(oldPassword, newPassword, cb) {
    if (!oldPassword || !newPassword) {
        return cb(new errors.MissingPasswordError(options.errorMessages.MissingPasswordError));
    }

    var self = this;

    this.authenticate(oldPassword, function(err, authenticated) {
        if (err) { return cb(err); }

        if (!authenticated) {
            return cb(new errors.IncorrectPasswordError(options.errorMessages.IncorrectPasswordError));
        }

        self.setPassword(newPassword, function(setPasswordErr, user) {
            if (setPasswordErr) { return cb(setPasswordErr); }

            self.save(function(saveErr) {
                if (saveErr) { return cb(saveErr); }

                cb(null, user);
            });
        });
    });
};

//export the users model
module.exports = mongoose.model('User', User);