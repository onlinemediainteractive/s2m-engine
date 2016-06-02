var Promise = require('bluebird');

var db = require("../../../lib/data_store/mysql");
var S2mResponse = Promise.promisifyAll(require("../../../lib/common/s2mResponse"));




validateApplication = function(appInfo) {

    var errors = [];

    return errors;
}

var Application = function() {

}

Application.prototype.verifyApplicationLogin = function(user_name, password) {
    var query = 'select id, payload from application_json where api_key = ? and api_secret = ?';
    var params = [user_name, password];
    return db.query(query,params).then(function(applicationInformation) {
        var resultRows = applicationInformation.length;
        var s2mResponse = new S2mResponse();
        
        if (resultRows == 1 ) {
            var appInfo = JSON.parse(applicationInformation[0].payload);
            appInfo.id = applicationInformation[0].id;
            s2mResponse.setAppInfo(appInfo);
            var errors = validateApplication(appInfo);
            if (errors.length == 0) {
                return s2mResponse;
            }

        } else if (resultRows > 1 ) {
            s2mResponse.setHttpResponse('FAILED_BASIC_AUTH_NO_USER_FOUND');
            return s2mResponse;
        }
        
    });
};

module.exports.Application = new Application();
