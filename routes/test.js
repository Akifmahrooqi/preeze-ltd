var express = require('express');
path = require('path'),
    router = express.Router(),
    bodyParser= require('body-parser'),
    formidable = require('formidable'),
    fs = require('fs');
// USED TO UPLOAD IMAGES TO CDN
var cloudinary = require('cloudinary');
var mongoose = require('mongoose');
var ObjectID = mongoose.Types.ObjectId();

const Supplier = require("../models/Supplier");

const dashbordController = require("../controllers/dashboardController");
cloudinary.config({
    cloud_name: 'fmonper1',
    api_key: '735289287634656',
    api_secret: 'xFfXVaxnQPhf_d72OGHZvkQWs4M'
});


// route for logout action
router.get('/CDNUpload', function (req,res) {
    res.render('tests/CDNupload');
});
router.post('/CDNUpload', function (req,res) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        var oldpath = files.fileToUpload.path;

        cloudinary.v2.uploader.upload(oldpath)
            .then(function(error, result) {
                console.log(result, error)
            });
        res.redirect('/test/CDNUpload');
    });
});

router.get('/tel-in p', function (req,res) {
    res.render('tests/tel-input.ejs');
});

router.get('/reduceItemCost', function (req, res) {
    Supplier.findById(req.user.supplierID).exec(function (err, doc) {
        // console.log(doc.products);
        doc.products.forEach(function (product) {
            console.log("pre" + product.sellingPrice);
            var newPrice = (product.sellingPrice/115) * 100 ;
            console.log("post" + newPrice);
            product.oldPrice = product.sellingPrice;
            product.sellingPrice = newPrice;
            console.log(product);
        });
        doc.save(function (err) {

        });
    });
});

router.get("/sendEmail", function (req, res) {
    // using SendGrid's v3 Node.js Library
// https://github.com/sendgrid/sendgrid-nodejs
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
        to: 'fernando.montero.perez@gmail.com',
        from: 'test@example.com',
        subject: 'Sending with SendGrid is Fun',
        text: 'and easy to do anywhere, even with Node.js',
        html: '<strong>and easy to do anywhere, even with Node.js</strong>',
    };
    sgMail.send(msg);
    res.send(msg);
});

router.get("/sortSuppliers", function (req, res) {
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
            ])
            .exec(function (err, doc) {
                Supplier.findById(req.user.supplierID).exec(function (error, supplier) {
                    supplier.products = doc[0].products;
                    console.log(doc);
                    console.log(doc[0].products);
                    console.log(supplier);
                    res.send(supplier);
                });
                // res.send(doc);
            });

// Supplier.find({ _id: req.user.supplierID }).sort({"products.sellingPrice":-1}).exec(function (err, doc) {
    //     // doc.markModified("products");
    //     // doc.save(function (err) {
    //     //
    //     // });
    //     res.send(doc);
    // });
});

router.get("/convertMongo", function (req, res) {
    var code;
    Supplier.findById("5bb221faf4f7171bc008d76a").select("-products._id ").exec(function (err, docs) {
       //  for (var i = 0; i < docs.products.length; i++) {
       //      var item = docs.products[i];
       //      item._id = new mongoose.Types.ObjectId();
       //      console.log(item._id);
       //  }
       // docs.save(function (err) {
       //
       // })
        docs.products.forEach(function (item) {
            item._id = mongoose.Types.ObjectId();
        });
        res.send(docs.products);
    });

    // Supplier.aggregate({
    //     $match: {_id : "5bb221faf4f7171bc008d76a"}
    // }, {
    //     $unwind: '$products'
    // }, {
    //     $project: {
    //         _id: 0
    //     }
    // }).exec(function (err, doc) {
    //     res.render("tests/convertMongo", {
    //         code : doc
    //     })
    // });

});

router.post("/convertMongo", function (req, res) {
    var code = JSON.parse(req.body.code);
    console.log(code);
    res.render("tests/convertMongo", {
        code : null
    })
});

router.get("/dashboard", dashbordController.supplier_dashboard);

module.exports = router;
