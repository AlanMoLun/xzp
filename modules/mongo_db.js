var redis = require('redis');
var _ = require('../libs/underscore-min.js');
var crypto = require("crypto");
var mongoDb = require('mongodb');
var async = require("async");
var util = require('./util.js');
var cache_manager = require('../modules/cache_manager.js');

var mongo_db = {};

mongo_db.mongoFindIds = function (doc, queryObj, callback) {
    var url = global.mongoDbOptions.url;
    mongoDb.MongoClient.connect(url, function (err, db) {
        db.collection(doc).find(queryObj, {_id: false, id: 1}).toArray(function (err, ids) {
            ids = _.pluck(ids, "id");
            console.log("ids", ids);
            callback(err, ids);
            db.close();
        });
    });
};

mongo_db.mongoFindAll = function (doc, callback) {
    var url = global.mongoDbOptions.url;
    mongoDb.MongoClient.connect(url, function (err, db) {
        db.collection(doc).find({}, {_id: false, id: 1}).toArray(function (err, ids) {
            ids = _.pluck(ids, "id");
            console.log("cp1", ids);
            async.map(ids, function (id, next1) {
                // cache_manager.delByGroupId(id);
                mongo_db.mongoFindOne(doc, id, next1);
            }, function (err, result) {
                db.close();
                result = _.compact(result);
                callback(err, result);
            });
        });
    });
};

mongo_db.mongoFindOne = function (doc, id, next) {
    var url = global.mongoDbOptions.url;
    if (id) {
        cache_manager.getByGroupId(id, function (err, foundObj) {
            if (foundObj && !_.isEmpty(foundObj)) {
                console.log("cp21 from Cache", id);
                next(null, foundObj);
            } else {
                mongoDb.MongoClient.connect(url, function (err, db) {
                    console.log("cp 22 from DB", id);
                    db.collection(doc).findOne({id:id}, {_id: false}, function (err, foundOne) {
                        if (foundOne && !_.isEmpty(foundOne)) {
                            cache_manager.setByGroupId(foundOne.id, foundOne, next);
                        } else {
                            next(null, {});
                        }
                        db.close();
                    });
                });
            }
        });
    } else {
        next(null, {});
    }
};

mongo_db.mongoAggregate = function (doc, aggregates, next) {
    var url = global.mongoDbOptions.url;
    mongoDb.MongoClient.connect(url, function (err, db) {
        db.collection(doc).aggregate(aggregates, next);
        db.close();
    });
};

mongo_db.mongoUpdate = function (doc, queryObj, updateObj, callback) {
    var url = global.mongoDbOptions.url;
    var isInsert = false;
    mongoDb.MongoClient.connect(url, function (err, db) {
        async.waterfall([
                function (next) {
                    if (queryObj && !_.isEmpty(queryObj)) {
                        db.collection(doc).find(queryObj).toArray(next);
                    } else {
                        next(null, null);
                    }
                },
                function (foundObj, next) {
                    if (foundObj && !_.isEmpty(foundObj)) {
                        delete updateObj.id;
                        db.collection(doc).updateOne(queryObj, {$set: updateObj}, next);
                    } else {
                        isInsert = true;
                        db.collection(doc).insertOne(updateObj, next);
                    }
                }],
            function (err, result) {
                db.close();
                callback(err, result, isInsert);
            });
    });
};

mongo_db.mongoUpdatePO = function (queryObj, updateObj, callback) {
    var url = global.mongoDbOptions.url;
    var isInsert = false;
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
                        db.collection("group_orders").updateOne(queryObj, {$set: {"orders.$": updateObj}}, next);
                    } else {
                        queryObj = {id: queryObj.id};
                        var isInsert = true;
                        db.collection("group_orders").updateOne(queryObj, {$push: {"orders": updateObj}}, next);
                    }
                }],
            function (err, result) {
                db.close();
                callback(err, result, isInsert);
            });
    });
};

mongo_db.mongoRemove = function (doc, authUser, queryObj, callback) {
    var url = global.mongoDbOptions.url;
    mongoDb.MongoClient.connect(url, function (err, db) {
        async.waterfall([
                function (next) {
                    if (queryObj && !_.isEmpty(queryObj)) {
                        db.collection(doc).findOne(queryObj, next);
                    } else {
                        next(null, null);
                    }
                },
                function (foundObj, next) {
                    if (foundObj && !_.isEmpty(foundObj)) {
                        var isUserIdMatch = util.matchUserId(authUser, foundObj.user_info);
                        if(isUserIdMatch) {
                            db.collection(doc).findOneAndDelete(queryObj, function(err, result){
                                next(err, result, foundObj);
                            });
                        } else {
                            next(new Error("Authentication not pass, only owner can delete this order"));
                        }
                    } else {
                        next(new Error("group order not found"));
                    }
                }],
            function (err, result, foundObj) {
                db.close();
                callback(err, result, foundObj);
            });
    });
};

module.exports = mongo_db;
