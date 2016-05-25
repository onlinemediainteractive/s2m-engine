/**
 * Created by dfennell on 5/25/16.
 */



exports.daysBetween = function(dateFrom, dateTo) {

    var ndays = ((dateTo.getTime() - dateFrom.getTime()) / 1000 / 86400);

    return ndays;
};

//module.exports = utils;
