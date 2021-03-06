var express = require('express');
var _ = require('../libs/underscore-min.js');
var util = require('../modules/util');
var request = require('request');
var local = require('./local');

var login = {};

login.getAuth = function (req, next) {
    var code = req.body.code;
    checkLoginStatus(code, next);
};

login.checkAuth = function (req, next) {
    var sessionId = req.body.sessionId;
    var userId = req.body.userId;
    if(!sessionId) {
        sessionId = req.query.sessionId;
    }
    if(!userId) {
        userId = req.query.userId;
    }
    checkAuthFromCache(sessionId, userId, next);
};

function checkLoginStatus(code, next) {
    if (code) {
        var options = {
            uri: "https://api.weixin.qq.com/sns/jscode2session",
            json: true,
            qs: {
                grant_type: 'authorization_code',
                appid: local.wx.appid,
                secret: local.wx.secret,
                js_code: code
            }
        };
        request(options, function (err, response, data) {
            if (typeof next != "undefined") {
                if (response.statusCode === 200 && data && data.openid && data.session_key) {
                    console.log("[openid]", data.openid);
                    console.log("[session_key]", data.session_key);

                    var userId = util.getUserId(data.openid);
                    var user_info = {openId: data.openid, session_key: data.session_key, code: code, userId: userId};
                    var cache_key = util.getToken(data.openid, data.session_key);
                    console.log("cache_key", cache_key);
                    cache.set(cache_key, JSON.stringify(user_info), function (err) {
                        if (err) {
                            next(err);
                        } else {
                            cache.expire(cache_key, 7200);
                            next(null, {sessionId: cache_key, userId: userId});
                        }
                    });
                } else {
                    console.log("error", err);
                    next(err);
                }
            }
        });
    } else {
        if (typeof next != "undefined")
            next(new Error("no code provided"));
    }
}

function checkAuthFromCache(sessionId, userId, next){
    var cache = global.cache;
    if(sessionId){
        cache.get(sessionId, function (err, reply) {
            if(reply){
                reply = util.parseJSON(reply);
                if(userId == reply.userId) {
                    next(err, true, reply);
                } else {
                    next(null, false, {});
                }
            } else {
                next(null, false, {});
            }
        });
    } else {
        next(null, false, {});
        // next(new Error("no sessionId provided"));
    }
}

module.exports = login;
