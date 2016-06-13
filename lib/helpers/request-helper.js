var rp = require('request-promise');



module.exports = function (options) {
    return  rp(options)
        .then(function (httpResponse) {
            this.httpResponse  = httpResponse;
            this.params.href = httpResponse.href;
            this.params.id = httpResponse.id;
            this.params.emailAlais = this.params.email;
            var emailAlias = this.params.email;
            this.params.email  = emailAlias.substring(emailAlias.indexOf('.'));

            return httpResponse;
        }).catch(function(httpResponse) {
            this.httpResponse  = httpResponse;
            //var s2mResponse = undefined;
            if (httpResponse.statusCode  > 499) {
                this.s2mResponse = new S2mResponse('REMOTE_ERR');
            }
            else {

                this.s2mResponse= new S2mResponse('FAILED_EXTERNAL_VALIDATION', httpResponse.error.error.message);
            };
            return httpResponse;
            //throw(s2mResponse);
        });
};
}
