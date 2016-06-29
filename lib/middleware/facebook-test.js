
var FacebookTokenStrategy = require('passport-facebook-token');

function con() {

    var userName = 'Suresh';
    var accessToken = '1577993765849848';
    var refreshToken = null;
    var profile = null;
    passport.use(new FacebookTokenStrategy({
            clientID: process.env.FACEBOOK_APP_ID,
            clientSecret: process.env.FACEBOOK_APP_SECRET_QUESTION
        }, function(accessToken, refreshToken, profile, done) {
            User.findOrCreate({facebookId: profile.id}, function (error, user) {
                return done(error, user);
            });
        }
    ));

}








module.exports = function (req, res, next) {
    var scriptName = __filename.split(/[\\/]/).pop();
    logger.debug(scriptName + ' Starting ....');

    con();

    logger.debug(scriptName + ' Continue ....');
}