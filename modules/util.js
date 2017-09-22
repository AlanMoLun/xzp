var express = require('express');
var redis = require('redis');
var _ = require('../libs/underscore-min.js');
var UAParser = require('ua-parser-js');
var parser = new UAParser();
var crypto = require("crypto");
var mongoDb = require('mongodb');
var async = require("async");
var local = require('./local');

var util = {};

util.getModelFieldValue = function (model_name, model_field, fieldValue, next)
{
    var pool = global.db;
    var cache = global.cache;
    if(typeof fieldValue == "string"){
        fieldValue = fieldValue.toLowerCase();
    }
    var cache_key = 'model_' + model_name + '_' + model_field + '_' + fieldValue;
    var strsql = 'SELECT * from ' + model_name + ' where ' + model_field + '=' + pool.escape(fieldValue);
    cache.get(cache_key, function (err, reply) {
        if (reply) {
            next(null, JSON.parse(reply));
        } else if (err) {
            next(err);
        } else {
            util.sqlExec(pool, strsql, null, function (err, records) {
                if(err){
                    next(err);
                }else{
                    var string = '{}';
                    if (records.length > 0) {
                        string = JSON.stringify(records[0]);
                        cache.set(cache_key, string, function (err, reply) {
                            if (reply) {
                                cache.expire(cache_key, 86400);
                                next(null, JSON.parse(string));
                            } else {
                                next(err);
                            }
                        });
                    } else {
                        next(err);
                    }
                }
            });
        }
    });
};

util.sqlExec = function (pool, strsql, sqlObj, next){
    pool.getConnection(function (err, connection) {
        if (err){
            next(err);
        }else {
            connection.query(strsql, sqlObj, function (err, records) {
                next(err, records);
            });
            connection.release();
        }
    });
};

util.mongoFind = function (queryObj, next) {
    var url = global.mongoDbOptions.url;
    mongoDb.MongoClient.connect(url, function (err, db) {
        if (queryObj && !_.isEmpty(queryObj)) {
            db.collection("group_orders").find(queryObj, {_id: false}).toArray(next);
        } else {
            db.collection("group_orders").find({}, {_id: false}).toArray(next);
        }
        db.close();
    });
};

util.mongoUpdate = function (queryObj, updateObj, callback) {
    var url = global.mongoDbOptions.url;
    mongoDb.MongoClient.connect(url, function (err, db) {
        async.waterfall([
                function (next) {
                    if (queryObj && !_.isEmpty(queryObj)) {
                        db.collection("group_orders").find(queryObj).toArray(next);
                    } else {
                        next(null, null);
                    }
                },
                function (foundObj, next) {
                    if (foundObj && !_.isEmpty(foundObj)) {
                        db.collection("group_orders").updateOne(queryObj, updateObj, next);
                    } else {
                        db.collection("group_orders").insertOne(updateObj, next);
                    }
                }],
            function (err, result) {
                db.close();
                callback(err, result);
            });
    });
};

util.mongoUpdatePO = function (queryObj, updateObj, callback) {
    var url = global.mongoDbOptions.url;
    mongoDb.MongoClient.connect(url, function (err, db) {
        async.waterfall([
                function (next) {
                    if (queryObj && !_.isEmpty(queryObj)) {
                        db.collection("group_orders").find(queryObj).toArray(next);
                    } else {
                        next(null, null);
                    }
                },
                function (foundObj, next) {
                    if (foundObj && !_.isEmpty(foundObj)) {
                        db.collection("group_orders").updateOne(queryObj, {$set: {"orders.$.purchases": updateObj.purchases, "orders.$.user_info": updateObj.user_info}}, next);
                    } else {
                        queryObj = {id: queryObj.id};
                        db.collection("group_orders").updateOne(queryObj, {$push: {"orders": updateObj}}, next);
                    }
                }],
            function (err, result) {
                db.close();
                callback(err, result);
            });
    });
};

util.mongoUpdateItem = function (queryObj, updateObj, callback) {
    var url = global.mongoDbOptions.url;
    mongoDb.MongoClient.connect(url, function (err, db) {
        db.collection("group_orders").updateOne(queryObj, {$set: {"items": updateObj.items, "title": updateObj.title}}, callback);
        db.close();
    });
};

util.getTS = function (datetime) {
    var intDateTime = new Date().getTime();
    if (datetime) {
        intDateTime = new Date().getTime(datetime);
    }
    return parseInt(intDateTime / 1000, 10);
};

util.getToken = function (openId, session_key) {
    var secret = openId + '_' + session_key;
    var sha = crypto.createHash("sha256");
    return sha.update(secret).digest("hex");
};

util.getUserId = function (openId) {
    var secret = openId + "_" + local.wx.secret;
    var md5 = crypto.createHash("md5");
    return md5.update(secret).digest("hex");
};

util.checkDate = function(ts){
    var now = util.getTS();
    var dateDiff = now - ts;
    return (dateDiff < 86400);
};

util.getBrowserInfo = function(req) {
    var ua = req.headers['user-agent'];
    return browser = parser.setUA(ua).getBrowser();
};

util.getOSInfo = function(req) {
    var ua = req.headers['user-agent'];
    return OS = parser.setUA(ua).getOS();
};

util.isMobile = function(req){
    var deviceType = req.device.type;
    return (deviceType == 'mobile');
};

util.isIOS = function(req) {
    var ua = req.headers['user-agent'];
    var OS = parser.setUA(ua).getOS().name;
    return (OS == 'iOS');
};

util.nocache = function nocache(req, res, next) {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next();
};

util.parseJSON = function (str) {
    try {
        return JSON.parse(str);
    } catch (e) {
        console.log("util parserJSON", e.message);
        return {};
    }
};

module.exports = util;
