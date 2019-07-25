var app = require('../app');
var request = require('supertest')(app);
var login = require('./helpers/login_helper');

describe('MyApp', function () {

    var agent;

    before(function (done) {
        login.login(request, function (loginAgent) {
            agent = loginAgent;
            done();
        });
    });

    it('should allow access to admin when logged in', function (done) {
        var req = request.get('/admin');
        agent.attachCookies(req);
        req.expect(200, done);
    });

});