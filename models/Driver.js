/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Supplier = require('./Supplier.js'),
    SupplierSchema = mongoose.model('Supplier').schema,
    Product = require('./Product.js'),
    ProductSchema = mongoose.model('Product').schema;
    // Sale = require('./Sale.js'),
    // SaleSchema = mongoose.model('Sale').schema;


// Create a new schema for the reviews collection with all the relevant information for a review
var Schema = mongoose.Schema;

var Driver = new Schema(
    {
        telephoneNumber: String,
        carMaker: String,
        carLicenseNumber: String,
        driverLicenseImage: String,
        currentJobs: [{type: Schema.Types.ObjectId, ref: 'Sale'}],
        finishedJobs: [{type: Schema.Types.ObjectId, ref: 'Sale'}],
        bankDetails: {
            accountNumber: {type: String, maxLength: 8, minLength: 8 },
            sortCode: {type: String, maxLength: 6, minLength: 6 }
        },
        stripe_account_id: String
    }
);

var DriverModel = mongoose.model('Driver', Driver );


// export the review model
module.exports = DriverModel;