var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var Product = new Schema(
    {
        title: {type: String, required: true, max: 32},
        inStock: Number,
        typeOfItem: {
                type: String
                // enum: ['alcohol', 'mixer', 'other']
        },
        typeOfAlcohol: {
                type: String
                // enum: ['rum', 'whisky', 'vodka', 'gin']
        },
        sellingPrice: {type: Number, required: true, min: 0.5},
        oldPrice: {type: Number},
        isPack: {type: Boolean, default: false},
        packItems: [{type: String}],
        image: {type: String, required: true},
        verified: { type: Boolean, default: false}
    }
);

module.exports = mongoose.model('Product', Product);