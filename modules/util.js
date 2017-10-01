var express = require('express');
var _ = require('../libs/underscore-min.js');
var UAParser = require('ua-parser-js');
var parser = new UAParser();
var crypto = require("crypto");
var local = require('./local.js');
var env = require('./set_env.js').env;

var util = {};

util.matchUserId = function (authUser, user_info) {
    if(!authUser || _.isEmpty(authUser)){
        return isDevelopment;
    }
    return (authUser.userId == user_info.userId);
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

util.getCacheHeader = function (model_name, model_field){
    var key_header = (env== "development" || env =="production-dev") ? "dev" : "pro";
    return key_header + "_model_" + model_name + "_" +  model_field + "_";
};

util.getCacheListHeader = function (model_name, model_field){
    var key_header = (env== "development" || env =="production-dev") ? "dev" : "pro";
    return key_header + "_stack_" + model_name + "_" +  model_field + "_";
};

module.exports = util;
