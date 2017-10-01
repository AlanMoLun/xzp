var express = require('express');
var _ = require('../libs/underscore-min.js');
var util = require('../modules/util');
var async = require('async');

var user_info = {};

user_info.list = function (id, next) {
    var queryObj = {};
    var orderBy = {created_at: -1};
    if (id) {
        queryObj.id = id;
    }
    mongo_db.mongoFind("user_info", queryObj, orderBy, next);
};

user_info.update = function (updateObj, next) {
    if(updateObj && updateObj.userId) {
        var queryObj = {};
        queryObj.userId = updateObj.userId;
        mongo_db.mongoUpdate("user_info", queryObj, updateObj, next);
    } else {
        next(new Error("provided object is empty"));
    }
};

user_info.remove = function (authUser, userId, next) {
        var queryObj = {id: userId};
        util.mongoRemove("user_info", authUser, queryObj, next);
};

module.exports = user_info;
