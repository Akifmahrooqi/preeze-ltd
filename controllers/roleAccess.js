var ConnectRoles = require('connect-roles');
var bodyParser= require("body-parser");

// DOCUMENTATION: https://github.com/ForbesLindesay/connect-roles
// More https://github.com/saintedlama/passport-local-mongoose


var roles = new ConnectRoles({
    failureHandler: function (req, res, action) {
        // optional function to customise code that runs when
        // user fails authorisation
        var accept = req.headers.accept || '';
        res.status(403);
        if (~accept.indexOf('html')) {
            // res.render('access-denied', {action: action});
            req.flash('error', 'Access Denied - You don\'t have permission to: ' + action);
            res.redirect('/login');
        } else {
            req.flash('error', 'Access Denied - You don\'t have permission to: ' + action);
            res.redirect('/login');
        }
    }
});

roles.use('access driver page', function (req) {
    console.log('access private page');
    if (req.user.role === 'driver') {
        return true;
    }
});

roles.use('access supplier page', function (req) {
    console.log('access private page');
    if (req.user.role === 'supplier') {
        return true;
    }
});

//admin users can access all pages
roles.use(function (req) {
    if (req.user.role === 'admin') {
        return true;
    }
});

module.exports = roles;