var express = require('express');
path = require('path'),
    router = express.Router(),
    bodyParser= require('body-parser'),
    formidable = require('formidable'),
    fs = require('fs');
// USED TO UPLOAD IMAGES TO CDN
var cloudinary = require('cloudinary');
var mongoose = require('mongoose');

router.post("/convertMongo", function (req, res) {
    var code = JSON.parse(req.body.code);
    console.log(code);
    res.render("tests/convertMongo", {
        code : null
    })
});

router.get("/cookies", function (req, res) {
    res.render("static_pages/cookies",  {user : req.user});
});

router.get("/privacy", function (req, res) {
    res.render("static_pages/privacy_policy",  {user : req.user});
});

router.get("/termsAndConditions", function (req, res) {
    res.render("static_pages/terms_and_conditions",  {user : req.user});
});
module.exports = router;

