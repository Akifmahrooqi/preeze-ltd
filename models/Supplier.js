/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Address = require('./Address.js'),
    AddressSchema = mongoose.model('Address').schema,
    Product = require('./Product.js'),
    ProductSchema = mongoose.model('Product').schema;

// Create a new schema for the reviews collection with all the relevant information for a review
var Schema = mongoose.Schema;

var Supplier = new Schema(
    {
        name: {type: String, required: true},
        address: AddressSchema,
        legalEntityAddress: AddressSchema,
        legalEntityDoB: Date,
        location: {
            type: {type:String, default: 'Point'},
            coordinates: [Number] // [<longitude>, <latitude>]
        },
        telephoneNumber: String,
        products: [ProductSchema],
        bankDetails: {
            accountNumber: {type: String, maxLength: 8, minLength: 8 },
            sortCode: {type: String, maxLength: 6, minLength: 6 },
            acctHolderName: String
        },
        stripe_account_id: String,
    }
);

Supplier.index({location: '2dsphere'});

var SupplierModel = mongoose.model('Supplier', Supplier );

// export the review model
module.exports = SupplierModel;