var bodyParser= require("body-parser"),
    exports = {},
    User = require("../models/User"),
    Driver = require("../models/Driver"),
    Sale = require("../models/Sale"),
    Coupon = require("../models/Coupon"),
    Supplier = require("../models/Supplier"),
        validator = require('validator');

const fs = require('fs');

// Display Product create form on GET.
exports.admin_index_get = function(req, res) {
    console.log('accessed admin page');
    res.render('admin/admin', { user : req.user });
};

exports.admin_find_user_get = function(req, res) {
    // console.log('accessed admin page');
    res.render('admin/admin_find_user', { user : req.user, foundUsers: null, message: null });
};

exports.admin_find_user_post = function(req, res) {
    // console.log('accessed admin page');
    User.find().or([{name: new RegExp(req.body.searchParam, 'i')}, {username: new RegExp(req.body.searchParam, 'i')}])
    .select('name surname username role')
    .exec(function (err, docs) {
        res.render('admin/admin_find_user', { user : req.user, foundUsers: docs, message: null });
    });
};

exports.admin_view_profile_get = function(req, res) {
    User.findById(req.params.id, function (err, docs) {
            console.log(docs);
            res.render('admin/view_profile', { user : req.user, foundUser: docs});
        });
};


exports.admin_make_supplier_get = function(req, res) {
    // console.log('accessed admin page');
    res.render('admin/admin_make_supplier', { user : req.user, foundUser: null, message: null });
};

exports.admin_make_supplier_post = function(req, res) {
    User.findOne({ username: req.body.email }, function (err, fUser) {
        if (err) {return res.render('admin_make_supplier', { user : req.user, foundUser: "No users found" + err, message: null })};
        res.render('admin/admin_make_supplier', { user : req.user, foundUser: fUser, message: null });
    });
    // console.log('accessed admin page');
};

exports.admin_change_role_post = function(req, res) {
    User.findOneAndUpdate({ _id: req.params.id }, {role :req.body.role}, function (err, fUser) {
        console.log(req.body);
        if (err) return res.render('admin_make_supplier', { user : req.user, foundUser: fUser , message: "There was an error processing your request"});
        console.log(fUser._id+' updated succesfully');
        // console.log(fUser);
        fUser.role = req.body.role;
        res.render('admin/admin_make_supplier', { user : req.user, foundUser: fUser, message: "User " + fUser.name + " was succesfuly updated"});
    });
    // console.log('admin_change_role_post');
};

exports.admin_accept_product_get = function (req, res) {
    Supplier.find({'products.verified' : false}, function(err, docs) {
        res.render('admin/admin_accept_product', { user : req.user, suppliers: docs });
    });
};

exports.admin_accept_product_post = function (req, res) {
    console.log(req.body);
    Supplier.findById(req.body.supplierID, function (err, supplier) {
        if (err) return err;
        // console.log(supplier);
        // console.log(req.body);
        var product = supplier.products.id(req.body.productID);
        console.log(product);
        product.verified = true;
        supplier.save(function(err) {
            if (err) console.log( err);
            res.redirect('/admin/acceptProduct');
        });
        // console.log(product);
    });
};

exports.admin_verify_id_get = function (req, res) {
    User.find({isIDVerified: false})
        .exec(function (err, users) {
            if (err) return err;
            res.render('admin/admin_verify_id', { user : req.user, users: users });
    });
};

exports.admin_verify_id_post = function(req, res){
    console.log("POST MADE TO /VERIFYID");
    console.log('body: ' + JSON.stringify(req.body));

    var obj = req.body;
    User.findById(obj.id, function (err, user) {
       if (err) return err;
       // console.log(user);
       if (obj.verify === true) {
           user.isIDVerified = true;
           user.save(function (err, succ) {
               if (err) return err;
           })
       } else {
           user.isIDVerified = false;
           try {
               fs.unlink(user.IDCard);
               // console.log('successfully deleted image');
           } catch (err) {
               // handle the error
           }
           user.IDCard = null;
           user.save(function (err, succ) {
               if (err) return err;
           })
       }
    });
    // console.log('body: ' + JSON.stringify(req.body));
    res.contentType('json');
    res.send({ status: "ok" });
};

exports.admin_view_drivers = function (req, res) {

    Driver.find()
        .populate('finishedJobs', 'deliveryTime')
        .exec(function (err, docs) {
            if (err) return err;
            // console.log(docs);
            res.render('admin/view_drivers', {user : req.user, data: docs});
        })
};

exports.admin_view_drivers_post = function (req, res) {

    Driver.find()
        .populate({
            path: 'finishedJobs',
            match: {
                'deliveryTime':
                    {
                        $gte: new Date(req.body.start + 'T00:00:00.000Z'),
                        $lte: new Date(req.body.end + 'T23:59:59.999Z')
                    }
            }
        })
        .exec(function (err, docs) {
            if (err) return err;
            // console.log(docs);
            res.send(docs);
        })
};

exports.admin_view_suppliers_get = function (req, res) {
    Sale.aggregate([
        { $project : { supplierID : 1, totalCost : 1, deliveryCost: 1 } },
        { $group : { _id: "$supplierID", revenue : { "$sum" : "$totalCost" }, delivery_costs : { "$sum" : "$deliveryCost" }, total_sales : { "$sum" : 1 } } },
        { $sort : { total_qty : -1 } }
    ])
        .exec(function (err, docs) {
            if (err) return err;
            Supplier.populate(docs, {path: "_id"}, function (err, newDocs) {
                // console.log(newDocs);
                res.render('admin/view_suppliers', {user : req.user, data: newDocs, });

            });
            // console.log(docs);
            // res.render('admin/view_suppliers', {user : req.user, data: docs});
        })
};

exports.admin_view_suppliers_post = function (req, res) {
    // console.log("POST MADE TO /viewSuppliers");
    // console.log('body: ' + JSON.stringify(req.body));
    Sale.aggregate([
        {$match : {
                'saleDate':
                    {
                        '$gte': new Date(req.body.start+'T00:00:00.000Z'),
                        '$lte': new Date(req.body.end+'T23:59:59.999Z')
                    }
            }
        },
        { $project : { supplierID : 1, totalCost : 1, deliveryCost: 1 } },
        { $group : { _id: "$supplierID", revenue : { "$sum" : "$totalCost" }, delivery_costs : { "$sum" : "$deliveryCost" }, total_sales : { "$sum" : 1 } } },
        { $sort : { total_qty : -1 } }
    ])
        .exec(function (err, docs) {
            if (err) return err;
            Supplier.populate(docs, {path: "_id"}, function (err, newDocs) {
                // console.log(newDocs);
                res.send(newDocs);

            });
            // console.log(docs);
            // res.send(docs)
        })
};

exports.admin_view_coupons_get = function(req, res) {
    Coupon.find({}, function (err, docs) {
       if (err) return err;
       res.render('admin/coupons', {user : req.user, coupons: docs});
    });
};

exports.admin_create_coupon_post = function(req, res) {
    console.log(req.body);
    var errors = {};

    var nCoupon = new Coupon({
        name: req.body.couponCode,
        discountAmount: req.body.discountAmount,
        deliveryDiscountAmount: req.body.deliveryDiscountAmount,
        minimumAmount: req.body.minimumAmount,
        expirationDate: req.body.expirationDate,
        timesUsed: 0
    });
    nCoupon.save(function (err, coupon) {
       res.redirect('/admin/viewCoupons');
    });
};

exports.admin_delete_coupon_post = function (req, res) {
  Coupon.findByIdAndRemove(req.body.couponID, function (err, succ) {
      if (err) return err;
      res.redirect('/admin/viewCoupons');
  }) // executes
};
module.exports = exports;