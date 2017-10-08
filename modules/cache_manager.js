var _ = require('../libs/underscore-min.js');
var util = require('./util.js');
var async = require("async");

var cache_manager = {};
var CACHE_KEYS_USER_LIST =  util.getCacheListHeader("user", "id");

cache_manager.getGroupIdsForUser = function (userId, next) {
    var cache = global.cache;
    var cache_key = CACHE_KEYS_USER_LIST + userId;
    cache.LRANGE(cache_key, 0, -1, next);
};

cache_manager.getById = function (doc, docId, next) {
    var cache = global.cache;
    var cache_key = util.getCacheHeader(doc, docId) + docId;
    cache.get(cache_key, function(err, reply){
        if(reply && !_.isEmpty(reply)){
            next(err, util.parseJSON(reply));
        } else {
            next(null, {});
        }
    });
};

cache_manager.setById = function (docId, updateObj, next) {
    var cache = global.cache;
    var cache_key = util.getCacheHeader(doc, docId) + docId;
    console.log("cache_key", cache_key);
    var updateObjString = JSON.stringify(updateObj);
    cache.set(cache_key, updateObjString, function(err) {
        cache.expire(cache_key, 86400);
        if (typeof next != "undefined") {
            next(err, updateObj);
        }
    });
};

cache_manager.delById = function (doc, docId, next) {
    var cache = global.cache;
    var cache_key = util.getCacheHeader(doc, docId) + docId;
    cache.del(cache_key, next);
};

cache_manager.del_userId_list = function(userId, next) {
    var cache = global.cache;
    var cache_key = CACHE_KEYS_USER_LIST + userId;
    cache.del(cache_key, next);
};

cache_manager.remove_ids_from_userId_list = function(userIds, groupId, callback) {
    var cache = global.cache;
    async.map(userIds, function (userId, next) {
        var cache_key = CACHE_KEYS_USER_LIST + userId;
        cache.LREM(cache_key, 0, groupId, next);
    }, function (err, result) {
        callback(err, result);
    });
};

cache_manager.rpush_ids_to_userId_list = function(userId, ids, next) {
    var cache_key = CACHE_KEYS_USER_LIST + userId;
    rpush_ids_to_cache(cache_key, ids, next);
    cache.expire(cache_key, 86400);
};

cache_manager.rpush_single_id_to_userId_list = function(userId, id, next) {
    var cache_key = CACHE_KEYS_USER_LIST + userId;
    rpush_single_id_to_cache(cache_key, id, next);
};

function rpush_ids_to_cache(cache_key, ids, callback) {
    var cache = global.cache;
    async.map(ids, function(id, next){
        if (typeof id == "object") {
            id = JSON.stringify(id);
        }
        cache.RPUSH(cache_key, id, next);
    }, function(){
        cache.LLEN(cache_key, function (err, keyLength) {
            if (keyLength) {
                cache.LTRIM(cache_key, 0, 99, callback);
            } else {
                if(typeof callback != "undefined"){
                    callback();
                }
            }
        });
    });
}

function rpush_single_id_to_cache(cache_key, id, next) {
    var cache = global.cache;
    cache.LRANGE(cache_key, 0, -1, function (err, ids) {
        if (ids && ids.length) {
            var foundId = ids.indexOf(id);
            if(foundId == -1){
                cache.RPUSH(cache_key, id, function(){
                    RTRIM(cache_key, ids.length, 99, next);
                });
            } else {
                if(typeof next != "undefined"){
                    next();
                }
            }
        }else{
            if(typeof next != "undefined"){
                next();
            }
        }
    });
}

function RTRIM(cache_key, keyLength, number, next) {
    var cache = global.cache;
    var start = keyLength - number + 1;
    var end = start + number;
    cache.LTRIM(cache_key, start, end, next);
}

module.exports = cache_manager;
