/**
 * Module dependencies.
 */
var mongoose = require('mongoose');


// Create a new schema for the reviews collection with all the relevant information for a review
var Schema = mongoose.Schema;

var Address = new Schema(
    {
        houseAndStreet: String,
        city: String,
        postcode: String,
        location: {
            type: {type:String, default: 'Point'},
            coordinates: [Number] // [<longitude>, <latitude>]
        },
        county: String
    }
);

Address.index({location: '2dsphere'});


var AddressModel = mongoose.model('Address', Address );


// export the review model
module.exports = AddressModel;