var platform_fee = process.env.PLATFORM_FEE;

var exports = {};

// A small function that converts a price in the format £1.00 to 100 cents
exports.convert_to_cents = function(amount) {
    return new Promise(function (resolve, reject) {
        // Do async job

        if (!amount) {
            reject("No amount was supplied to convert_to_cents()");
        } else {
            resolve(amount *    100);
        }
    });
};

exports.price_with_fee = function(amount) {
    return new Promise(function (resolve, reject) {
        // Do async job

        if (!amount) {
            reject("No amount was supplied to price_with_fee()");
        } else {
            resolve(amount * platform_fee);
        }
    });
};
module.exports = exports;