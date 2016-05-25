/**
 * Created by dfennell on 5/3/16.
 */
var rest = require('rest');
var mime = require('rest/interceptor/mime');
var errorCode = require('rest/interceptor/errorCode');
var defaultRequest = require('rest/interceptor/defaultRequest');
var Promise = require('bluebird');

var API_TOKEN = '';

var client = rest.wrap(mime)
    .wrap(errorCode, { code: 500 })
    .wrap(defaultRequest, { headers: 'Authorization: Token token=' + API_TOKEN });

var post = function(path, params) {
    return new Promise(function(resolve, reject) {
        client({
            method: 'POST',
            path: url,
            params: params
        }).then(resolve, reject);
    });
};

var get = function(path, params) {
    return new Promise(function(resolve, reject) {
        client({
            method: 'GET',
            path: path,
            params: params
        }).then(resolve, reject);
    });
};

var createPost = function(path) {
    return function(params) {
        return post(path, params);
    };
};

var createGet = function(path) {
    return function(params) {
        return get(path, params);
    };
};

exports.client = client;
exports.post = post;
exports.get = get;

exports.methods = {

    /**
     * REST endpoint for creating an applicant
     * @type {Promise}
     */
    createApplicant: createPost('https://api.onfido.com/v2/applicants'),

    /**
     * REST API endpoint for retrieving an applicant
     * @type {Promise}
     */
    getApplicant: createGet('https://api.onfido.com/v2/applicants/{id}'),

    /**
     * REST API endpoint for listing all applicants
     * @type {Promise}
     */
    fetchApplicants: createGet('https://api.onfido.com/v2/applicants/')
};

exports.setApiToken = function (apiToken) {
    API_TOKEN = apiToken;
};