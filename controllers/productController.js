const {body,validationResult} = require('express-validator/check');
const {sanitizeBody} = require('express-validator/filter');
var money = require("../lib/preezeMoney");

var bodyParser= require("body-parser");

var Product = require("../models/Product");
var Supplier = require("../models/Supplier");


var mv = require('mv');
// USED TO UPLOAD IMAGES TO CDN
var cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_PUBLIC_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY
});


const PLATFORM_FEE = parseFloat(process.env.PLATFORM_FEE);
const TYPES_OF_ALCOHOL = require("../lib/typesOfAlcohol");

var exports = {};

// Display Product create form on GET.
exports.product_create_get = function(req, res) {
    res.render('products/product_add', { user : req.user, errors: null, platform_fee: PLATFORM_FEE, types_of_alcohol: TYPES_OF_ALCOHOL });
};

// Display Product page and Create Product on POST.
exports.product_create_post =
    function(req, res) {
        var form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {

            // Do some validation
            var errors = [];
            if (fields.title.length < 1) errors.push("Title can\'t be empty");
            if (fields.inStock.length < 1) errors.push("Stock can\'t be empty");
            if (fields.title.length < 1) errors.push("Title can\'t be empty");
            if (fields.sellingPrice.length < 1) errors.push("Selling price can\'t be empty");
            if (fields.inStock < 0) errors.push("Stock can\'t be zero or less");
            if (fields.sellingPrice < 0) errors.push("Selling price can\'t be zero or less");

            // Return to page and display errors in form.
            if (errors.length > 0) {
                req.flash('error','There were errors in the data provided. Please try again.');
                return res.redirect('/supplier/addProduct');
            }

            // take old path from users file system
            var oldpath = files.fileToUpload.path;
            // rename file
            var temp = Date.now() + files.fileToUpload.name;
            // make new path to save the file to the project directory
            var newpath = 'public/upload/' + temp;

            cloudinary.v2.uploader.upload(oldpath, { width: 150, height: 200, crop: "limit" })
            .then(function(result) {
                console.log("addingProduct");
                var finalPrice = parseFloat(fields.sellingPrice);

                var nProduct = new Product ({
                    title: fields.title,
                    inStock: fields.inStock,
                    typeOfItem: fields.typeOfItem,
                    sellingPrice: finalPrice,
                    image: result.secure_url
                });

                if (fields.typeOfItem === "alcohol") {
                    nProduct.set('typeOfAlcohol',fields.typeOfAlcohol)
                }

                if (fields.typeOfItem === "pack") {
                    console.log("pack");
                    var theFields = [fields.packItem1, fields.packItem2, fields.packItem3, fields.packItem4, fields.packItem5];
                    var packItems = [];
                    theFields.forEach(function (item) {
                        if(item.length > 1) {
                            packItems.push(item);
                        }
                    });
                    console.log(packItems);
                    nProduct.isPack = true;
                    nProduct.packItems = packItems;
                }

                Supplier.findById(req.user.supplierID, function (err, doc) {
                    if (err) return console.log("couldnt find by ID");
                    doc.products.push(nProduct);

                    doc.save(function(err) {
                        if(err) return console.log(err);
                        res.redirect('/supplier/sortAscending');
                    });
                });
        }).catch(function (err) {
            console.log(err);
            res.redirect('/supplier');
        });
    // console.log(req.body);
    });
};

exports.products_sort_get = function(req, res) {
    Supplier.aggregate(
        [
            {
                $match: {
                    _id : req.user.supplierID
                }
            },
            {
                $unwind: {
                    path : "$products"
                }
            },
            {
                $sort: {
                    'products.sellingPrice': 1
                }
            },
            {
                $group: {
                    '_id':'$_id','products': {'$push': '$products'}
                }
            },
        ]
    ).exec(function (err, doc) {
        Supplier.findById(req.user.supplierID)
        .exec(function (error, supplier) {
            supplier.products = doc[0].products;
            // console.log(doc);
            // console.log(doc[0].products);
            // console.log(supplier);
            // res.send(supplier);
            supplier.save(function(err) {
                if(err) console.log(err);
                return res.redirect('../supplier');
            });
        });
            // res.send(doc);
    });
};

exports.product_edit_get = function(req, res) {
    Supplier.findById(req.user.supplierID, function (err, succ) {
        if (err) return handleError(err);

        var product = succ.products.id(req.params.id);
        res.render('products/product_edit', { user : req.user , product: product, platform_fee: PLATFORM_FEE, types_of_alcohol: TYPES_OF_ALCOHOL });
    });
};

exports.product_edit_post = function(req, res) {
    var form = new formidable.IncomingForm();

    form.parse(req, function (err, fields, files) {
        if (err) {
            req.flash('warning', 'There was a problem in your form');
            res.redirect('/supplier');
        };
        // take old path from users file system
        var oldpath = files.fileToUpload.path;
        function processResult (result) {
            Supplier.findById(req.user.supplierID, function (err, fSupplier) {
                // console.log(fSupplier);
                var product = fSupplier.products.id(req.params.id);
                if (err) {
                    req.flash('warning', 'We couldn\'t find the supplier your\'e looking for.');
                    res.redirect('/supplier');
                }
                console.log(result);
                var finalPrice = parseFloat(fields.sellingPrice)*100;
                console.log(product);
                product.set('title', fields.title);
                product.set('inStock', fields.inStock);
                product.set('typeOfItem', fields.typeOfItem);
                product.set('sellingPrice', finalPrice);
                product.set('verified', false);
                if (fields.typeOfItem === "alcohol") product.set('typeOfAlcohol', fields.typeOfAlcohol);
                if (fields.typeOfItem === "pack") {
                    console.log("pack");
                    var theFields = [fields.packItem1, fields.packItem2, fields.packItem3, fields.packItem4, fields.packItem5];
                    var packItems = [];
                    theFields.forEach(function (item) {
                        if(item.length > 1) {
                            packItems.push(item);
                        }
                    });
                    console.log(packItems);
                    product.packItems = packItems;
                }

                if (files.fileToUpload.size > 0) product.set('image', result.secure_url);

                fSupplier.save(function (err, results) {
                    console.log(results);
                    res.redirect('/supplier/'+product._id+'/edit');
                    // res.render('product_edit', {user: req.user, product: product, platform_fee: PLATFORM_FEE, types_of_alcohol: TYPES_OF_ALCOHOL});
                });

            });
        }

        if (files.fileToUpload.size > 0) {
            cloudinary.v2.uploader.upload(oldpath, { width: 150, height: 200, crop: "mfit" })
                .then(processResult)
                .catch(function (err) {
                    console.log(err);
                    res.redirect('/supplier');
                })
        } else {
            console.log("No file");
            processResult("");
        }
    });
};

exports.product_restock_post = function (req, res) {
    if (req.body.restockAmount < 1) {
        req.flash('warning', 'Restock amount has to be at least 1');
        return res.redirect('/supplier');
    }
    Supplier.findById(req.user.supplierID, function (err, supplier) {
        if (err) return (err);
        var product = supplier.products.id(req.body.productID);
        var inStock = parseInt(product.inStock) + parseInt(req.body.restockAmount);
        product.set('inStock', inStock );
        supplier.save(function (err, succ) {
           if (err) return err;
            res.redirect('/supplier');
        });
        console.log(product);
    });
};

exports.product_delete_get = function (req, res) {
    Supplier.findById(req.user.supplierID, function (err, supplier) {
        if (err) return handleError(err);
        var product = supplier.products.id(req.params.id);
        supplier.products.pull(req.params.id);
        supplier.save(function(err, succ) {
            if (err) return err;
            res.redirect('/supplier');
        })
    });
};

module.exports = exports;