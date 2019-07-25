var superagent = require('superagent');
var agent = superagent.agent();
var theAccount = {
    "username": "t@t.com",
    "password": "1234"
};

exports.login = function (request, done) {
    request
        .post('/login')
        .send(theAccount)
        .end(function (err, res) {
            if (err) {
                throw err;
            }
            agent.saveCookies(res);
            done(agent);
        });
};