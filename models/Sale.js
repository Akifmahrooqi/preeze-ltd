/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Supplier = require('./Supplier.js'),
    SupplierSchema = mongoose.model('Supplier').schema,
    Product = require('./Product.js'),
    ProductSchema = mongoose.model('Product').schema,
    Driver = require('./Driver.js'),
    DriverSchema = mongoose.model('Driver').schema,
    User = require('./User.js'),
    UserSchema = mongoose.model('User').schema,
    Address = require('./Address.js'),
    AddressSchema = mongoose.model('Address').schema;


// Create a new schema for the reviews collection with all the relevant information for a review
var Schema = mongoose.Schema;

var Sale = new Schema(
    {
        braintreeID: String,
        supplierID: {type: Schema.Types.ObjectId, ref: 'Supplier'},
        buyerID: {type: Schema.Types.ObjectId, ref: 'User'},
        driverID: {type: Schema.Types.ObjectId, ref: 'Driver'},
        products: [{}],
        itemCost: Number,
        deliveryCost: Number,
        deliveryAddress: {type: AddressSchema, required: true},
        billingAddress: {type: AddressSchema},
        totalCost: {type: Number, required: true},
        amountForSupplier: Number,

        isDelivered: {type: Boolean, default: false},
        deliveryTime: {type: Date},
        isVerified: {type: Boolean, default: false},
        verificationTime:{type: Date},
        hasDriver: {type: Boolean, default: false},
        saleDate: {type: Date, default: Date.now},
        isPickedUp: {type: Boolean, default: false},
        pickupTime: {type: Date},

        isCanceled: {type: Boolean, default: false},
        canceledTime: {type: Date},

        coupon: {
            name: String,
            discountAmount: Number,
            deliveryDiscountAmount: Number
        },

        stripeChargeID: {type: String},
        storeIdentifier: {type: String, default: ""}
    }
);

var SaleModel = mongoose.model('Sale', Sale );

// export the Sale model
module.exports = SaleModel;