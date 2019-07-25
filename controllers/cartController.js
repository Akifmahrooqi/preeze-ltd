var bodyParser  = require("body-parser");
var request     = require('request');
var mongoose    = require('mongoose');
var exports     = {};

var User        = require("../models/User");
var Sale        = require("../models/Sale");
var Supplier    = require("../models/Supplier");
var Coupon      = require("../models/Coupon");

var express     = require('express');
var router      = express.Router();
var gateway     = require('../lib/gateway');

const DeliveryFee = process.env.DELIVERY_COST || 3;
const PLATFORM_FEE = process.env.PLATFORM_FEE;
const keyPublishable = process.env.PUBLISHABLE_KEY;
const keySecret = process.env.SECRET_KEY;
const stripe = require("stripe")(keySecret);

// *
// GET cart checkout page
// *
exports.cart_checkout_get = function (req, res) {
    if(req.session.cart && req.session.cart.length === 0) {
        delete req.session.cart;
        res.redirect('/cart/checkout');
    } else {
        var deliveryCost = parseFloat(DeliveryFee)*100;
        var nonceFromTheClient = req.body.paymentMethodNonce;
        var cart = req.session.cart;
        var total = 0.0;
        var supplierAmount = 0.0;
        var discountAmount = 0.0;
        var deliveryDiscount = 0.0;
        var customerID;
        var chargeID;
        var subtotal;
        console.log(req.session.cart);
        // if(cart)
        // cart.forEach(function (item) {
        //     subtotal = item.qty * get_price_with_fee(item.price);
        //     total += parseInt(subtotal);
        //     supplierAmount += (item.qty) * formatted_price(item.price);
        //     //console.log(get_price_with_fee(item.price));
        //     console.log(item.qty);
        //     console.log("subtotal "+subtotal+"; total "+total+"; supplierAmount "+supplierAmount );
        //     // totalWithFee += parseFloat(item.qty) * (parseFloat(item.price) * (1+PLATFORM_FEE));
        // });
        //
        // var fixed_total = total.toFixed(2);
        // const amount = Math.round((fixed_total - discountAmount + deliveryCost - deliveryDiscount));
        // const amount_for_supplier = supplierAmount;
        // // console.log(req.body);
        // console.log("total: " + total);
        // // console.log("totalWithFee: " + totalWithFee);
        // console.log("fixed total: " + fixed_total);
        // console.log("deliveryFee: " + DeliveryFee);
        // console.log("discountAmount: " + discountAmount);
        // console.log("deliveryDiscount: " + deliveryDiscount);
        // console.log("supplier_amount: " + supplierAmount);
        // console.log("supplier_amount*100: " + supplierAmount*100);
        // console.log("amount_for_supplier: " + amount_for_supplier);
        // console.log("amount: " + amount);
        // console.log(req.user);

        Supplier.findById(req.session.cartSupplier, function (err, data) {
            if (err) return err;
            // console.log(req.user);
            res.render('cart/checkout', {
                title: "Checkout",
                user : req.user,
                cart: req.session.cart,
                coupon: req.session.coupon,
                supplier: data,
                minimumOrder: process.env.MINIMUM_ORDER,
                platformFee : PLATFORM_FEE,
                deliveryFee : DeliveryFee,
                keyPublishable: keyPublishable
            });
        });
    }
};

function get_price_with_fee(price) {
    console.log("Get price with fee");
    console.log("Price "+ price);
    price = price * 100;
    console.log("To cents "+ price);
    price = price + Math.round(price * (PLATFORM_FEE));
    console.log("With fee "+ price);
    return price;
}

function formatted_price(price) {
    return parseFloat(price)*100;
}

exports.stripe_checkout_post = function(req, res) {
    var deliveryCost = parseFloat(DeliveryFee)*100;
    var nonceFromTheClient = req.body.paymentMethodNonce;
    var cart = req.session.cart;
    var total = 0.0;
    var supplierAmount = 0.0;
    var discountAmount = 0.0;
    var deliveryDiscount = 0.0;
    var customerID;
    var chargeID;
    var subtotal;

    cart.forEach(function (item) {
        subtotal = parseInt(item.qty) * get_price_with_fee(item.price);
        total = parseInt(total) + parseInt(subtotal);
        supplierAmount += item.qty * formatted_price(item.price);
        console.log("subtotal "+subtotal+"; total "+total+"; supplierAmount "+supplierAmount );
        // totalWithFee += parseFloat(item.qty) * (parseFloat(item.price) * (1+PLATFORM_FEE));
    });
    // ADD THE FEE TO THE TOTAL

    if (total < process.env.MINIMUM_ORDER*100) {
        req.flash('warning','You didn\'t reach the minimum order');
        return res.redirect('/cart/checkout');
    }

    if (req.session.coupon) {
        var theCoupon = req.session.coupon[0];
        discountAmount = (total * (theCoupon.discountAmount/100));
        deliveryDiscount = (deliveryCost * (theCoupon.deliveryDiscountAmount/100));
        if (theCoupon.minimumAmount > total) {
            req.flash("error", "Your order amount doesn't surpass the coupon's minimum amount");
            return res.redirect("/cart/checkout");
        }
    }

    var fixed_total = total.toFixed(2);
    const amount = Math.round((fixed_total - discountAmount + deliveryCost - deliveryDiscount));
    const amount_for_supplier = supplierAmount;

    var nSale = new Sale({
        supplierID: mongoose.Types.ObjectId(req.session.cartSupplier),
        buyerID: mongoose.Types.ObjectId(req.user._id),
        products: req.session.cart,
        itemCost: (fixed_total - discountAmount),
        deliveryCost: (deliveryCost - deliveryDiscount)/100,
        deliveryAddress: req.user.deliveryAddress[req.body.deliveryAddress],
        billingAddress: req.user.billingAddress,
        totalCost: fixed_total,
        stripeAmount: amount,
        amountForSupplier: amount_for_supplier
    });

    if (req.session.coupon) {
        var zdiscountAmount = req.session.coupon[0].discountAmount || 0;
        var zdeliveryDiscountAmount = req.session.coupon[0].deliveryDiscountAmount || 0;
        nSale.coupon = {
            name: req.session.coupon[0].name,
            discountAmount: zdiscountAmount,
            deliveryDiscountAmount: zdeliveryDiscountAmount
        };
    }

    //     // console.log(req.body);
    // console.log("total: " + total);
    // // console.log("totalWithFee: " + totalWithFee);
    //     console.log("fixed total: " + fixed_total);
    //     console.log("deliveryFee: " + DeliveryFee);
    //     console.log("discountAmount: " + discountAmount);
    //     console.log("deliveryDiscount: " + deliveryDiscount);
    // console.log("supplier_amount: " + supplierAmount);
    // console.log("supplier_amount*100: " + supplierAmount*100);
    //     console.log("amount_for_supplier: " + amount_for_supplier);
    //     console.log("amount: " + amount);
    //     // console.log(req.user);

    var findStripeUser = new Promise(function(resolve, reject) {
        if (req.user.stripeCustomerID) {
            // IF THE CUSTOMER HAS A STRIPE ID A SOURCE IS ADDED TO IT
            customerID = req.user.stripeCustomerID;
            stripe.customers.createSource(
                customerID,
                { source: req.body.stripeToken },
                resolveSource
            );
            function resolveSource (err, card) {
                if (err) return reject(err);
                resolve(customerID);
            }
        } else {
            // IF THE CUSTOMER DOESNT HAVE A STRIPE ID, ONE IS CREATED
            stripe.customers.create({
                email: req.user.username,
                source: req.body.stripeToken,
                metadata: {
                    name: req.user.name,
                    surname: req.user.surname
                }
            })
            .then(findCustomer)
            .catch(function (err) {
                reject(err)
            });

            function findCustomer (customer) {
                customerID = customer.id;
                User.findById(req.user._id, storeCustomer);
            }
            function storeCustomer (err, user) {
                user.stripeCustomerID = customerID;
                user.save(function (err) {
                    if (err) reject(err);
                    resolve(customerID);
                })
            }
        }
    });

    var transferToSupplier = function (charge) {
        return new Promise(function (resolve, reject) {
            Supplier.findById(nSale.supplierID, function (err, fSupp) {
                if (err) reject(err);
                if (!fSupp.stripe_account_id) reject("The supplier doesn't have setup their account yet");
                // console.log("fSupp stripe account id: " + fSupp.stripe_account_id);
                // console.log("source_transaction:" + charge.id);
                stripe.transfers.create({
                    amount: amount_for_supplier,
                    currency: "gbp",
                    description: "Transfer to supplier " + fSupp._id + "",
                    source_transaction: charge.id,
                    destination: fSupp.stripe_account_id
                }).then(function (transfer) {
                    // asynchronously called
                    resolve(transfer);
                })
            });
        });
    };

    var updateUser = function (transfer) {
        new Promise(function(resolve, reject) {
            // Use the charge ID as the sale ID
            nSale.stripeChargeID = transfer.source_transaction;
            nSale.save(function (err, nSale) {
                if (err) reject(err);
                // Add the sale ID to the users purchases
                User.findById(req.user._id, function (err, user) {
                    user.purchases.unshift(nSale._id);
                    if (req.session.coupon) {
                        user.usedCoupons.push(req.session.coupon[0]._id);
                    }
                    // console.log("The coupon before deletion");
                    //Save the found model with the pushed ID
                    user.save(function (err, result) {
                        if (err) reject(err);
                        delete req.session.cart;
                        delete req.session.coupon;
                        return res.redirect('/cart/checkout/'+nSale._id);
                        resolve();
                    });
                });

            });
        });
    };

    findStripeUser.then(function(customerID) {
        return stripe.charges.create({
            amount,
            description: "Purchase at Preeze.co.uk",
            currency: "gbp",
            customer: customerID,
            receipt_email: req.user.username
            // source: req.body.stripeToken,
            // transfer_group: toString(nSale._id)
        })})
        .then(transferToSupplier)
        .then(updateUser)
        .catch(function (err) {
            console.log("Error:", err);
            req.flash('error', 'There was a problem processing your payment');
            console.warn("Payment rejected", {
                event: {
                    payment_rejected: { customer_id: req.user._id, reason: err }
                }
            });
            return res.redirect('/cart/checkout');
        });

};


exports.cart_checkout_success_get = function (req, res) {
    var result;
    var transactionId = req.params.id;
    // Create missing associations
    Sale.findById(transactionId)
        .populate('supplierID', 'name address telephoneNumber')
        .populate('driverID', 'telephoneNumber')
        .exec(function (err, sale) {
            if (err) {
                req.flash('error', 'There was an error finding that order.');
                res.redirect('/');
                // reject(err);
            } else {
                res.render('cart/checkout_success', {user : req.user, cart: req.session.cart, sale: sale, deliveryFee: DeliveryFee, platformFee: PLATFORM_FEE});
            }
        });
        // .catch(function (reason) {
        //     console.log(reason);
        //     req.flash('error', 'There was an error finding that order.');
        //     res.redirect('/');
        // });
};

exports.product_add_get = function (req, res) {
    Supplier.findById(req.params.supplier, function(err, supplier) {
        if (err) return err;
        // console.log(supplier.products);
        var product = supplier.products.id(req.params.item);
        console.log(product);

        if (req.params.supplier !== req.session.cartSupplier) delete req.session.cart;

        // if the cart is undefined we create one for the user
        if (typeof req.session.cart === "undefined") {
            req.session.cartSupplier = req.params.supplier;
            req.session.cart = [];
            req.session.cart.push({
                id: product._id,
                title: product.title,
                qty: 1,
                isPack : product.isPack,
                packItems: product.packItems,
                price: parseInt(product.sellingPrice),
                image: product.image
            });
        } else {
            var cart = req.session.cart;
            var newItem = true;

            for(var i = 0; i < cart.length; i++) {
                if (cart[i].title == product.title) {
                    cart[i].qty ++;
                    newItem = false;
                    break;
                }
            }

            if (newItem) {
                cart.push({
                    id: product._id,
                    title: product.title,
                    qty: 1,
                    isPack : product.isPack,
                    packItems: product.packItems,
                    price: parseInt(product.sellingPrice),
                    image: product.image
                });
            }
        }

        console.log(req.session.cart);
        console.log(req.session.cartSupplier);

        // req.flash('success', 'Product added');
        res.json(req.session.cart.length);
    });
};

exports.cart_update_get = function (req, res) {

    var product = req.params.product;
    var cart = req.session.cart;
    var action = req.query.action;
    console.log(action);

    for(var i = 0; i < cart.length; i++) {
        if (cart[i].title === product) {
            switch (action) {
                case "add":
                    cart[i].qty ++;
                    break;
                case "remove":
                    cart[i].qty --;
                    if(cart[i].qty<1) cart.splice(i,1);
                    break;
                case "clear":
                    cart.splice(i,1);
                    if (cart.length === 0) delete  req.session.cart;
                    break;
                case "default":
                    console.log("update problem");
                    break;
            }
            break;
        }
    }
    req.flash('success', 'Cart Updated');
    res.redirect('/cart/checkout');
};

exports.cart_clear_get = function(req, res) {
    delete req.session.cart;
    req.flash('success', 'The cart was cleared');
    res.redirect('/cart/checkout');
};

// // *
// // GET cart checkout page
// // *
// exports.cart_checkout_success_get = function (req, res) {
//     if(req.session.cart && req.session.cart.length == 0) {
//         delete req.session.cart;
//         res.redirect('/cart/checkout');
//     } else {
//         gateway.clientToken.generate({}, function (err, response) {
//             if (err) return err;
//
//             res.render('cart_checkout', {
//                 user : req.user,
//                 cart: req.session.cart,
//                 userToken: response.clientToken
//             });
//         });
//     }
// };

module.exports = exports;