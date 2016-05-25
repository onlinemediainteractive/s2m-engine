var _ = require('lodash');
//var client = require('./client');
var Promise = require('bluebird');

/**
 * The applicant module for nodefido
 */
var Applicant = function(params) {

    /**
     * Default params for an applicant
     * @type {Object}
     */
    var defaults = {
        id         : undefined,
        href       : undefined,
        title      : undefined,
        firstName  : undefined,
        middleName : undefined,
        lastName   : undefined,
        email      : undefined,
        gender     : undefined,
        dob        : undefined,
        telephone  : undefined,
        mobile     : undefined,
        country    : 'USA',
        id_number  : [],
        address    : [],
        created_at : new Date()
    };

    // Assigning defaults to params, and params to self
    _.assign(this, _.defaults(params, defaults));

    console.log(JSON.stringify(params));
};



module.exports = Applicant;