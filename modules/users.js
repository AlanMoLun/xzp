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
    util.mongoFind("user_info", queryObj, orderBy, next);
};

user_info.listByUserId = function (userId, callback) {
    if (userId) {
        async.parallel([
            function (next) {
                var queryObj = {"user_info.userId": userId};
                var orderBy = {created_at: -1};
                util.mongoFind("user_info", queryObj, orderBy, next);
            },
            function (next) {
                var aggregates = [];
                aggregates.push({$unwind: "$orders"});
                aggregates.push({$match: {"orders.user_info.userId": userId}});
                aggregates.push({$project: {_id: 0}});
                aggregates.push({ $sort : { created_at : -1}});
                util.mongoAggregate("user_info", aggregates, next);
            }
        ], function (err, result) {
            result = _.flatten(result);
            result = _.compact(result);
            result = _.uniq(result, 'id');
            result.sort(function (a, b) {
                return a.created_at - b.created_at;
            });
            callback(err, result);
        });
    } else {
        callback(new Error("provided userId is empty"));
    }
};

user_info.update = function (updateObj, next) {
    if(updateObj && updateObj.userId) {
        var queryObj = {};
        queryObj.userId = updateObj.userId;
        util.mongoUpdate("user_info", queryObj, updateObj, next);
    } else {
        next(new Error("provided object is empty"));
    }
};

user_info.updatePO = function (updateObj, next) {
    if(updateObj && updateObj.order_id) {
        var queryObj = {id: updateObj.group_order_id, "orders.id": updateObj.order_id};
        util.mongoUpdatePO(queryObj, updateObj.order, next);
    } else {
        next(new Error("provided object is empty"));
    }
};

user_info.list_mysql = function (id, callback) {
    async.waterfall([
        function(next){
            if(id) {
                next(null, [{id: id}]);
            } else {
                getCategoryIDs(next);
            }
        },
            async.apply(getGroupOrders)
        ],
        function (err, result) {
            callback(err, result);
        });
};

user_info.remove = function (authUser, group_order_id, next) {
        var queryObj = {id: group_order_id};
        util.mongoRemove("user_info", authUser, queryObj, next);
};

function getCategoryIDs(next) {
    var pool = global.db;
    var strsql = "SELECT id FROM group_order WHERE STATUS=0 AND DELETED_AT IS NULL";
    util.sqlExec(pool, strsql, null, next);
}

function getGroupOrders(records, next) {
    async.map(records, function (record, next1) {
        var group_order_id = record.id;
        util.getModelFieldValue("group_order", "id", group_order_id, function (err, group_order) {
            if(!_.isEmpty(group_order)){
                getItems(group_order_id, function (err, items) {
                    group_order.items = items;
                    getOrders(group_order_id, function (err, orders) {
                        group_order.orders = orders;
                        next1(err, group_order);
                    });
                });
            } else {
                next1(new Error("group order " + group_order_id + " not found"));
            }
        });
    }, function (err, results) {
        next(err, results);
    });
}

function getItems(group_order_id, callback) {
    var pool = global.db;
    var strsql = "SELECT id FROM item WHERE GROUP_ORDER_ID=" + pool.escape(group_order_id) + " AND DELETED_AT IS NULL";
    util.sqlExec(pool, strsql, null, function (err, records) {
        if (err) {
            callback(err);
        } else {
            if (records && records.length > 0) {
                async.map(records, function (record, next1) {
                    util.getModelFieldValue("item", "id", record.id, next1);
                }, function (err, results) {
                    callback(err, results);
                });
            } else {
                callback(null, []);
            }
        }
    });
}

function getOrders(group_order_id, callback) {
    var pool = global.db;
    var strsql = "SELECT id FROM order_item WHERE GROUP_ORDER_ID=" + pool.escape(group_order_id) + " AND DELETED_AT IS NULL";
    util.sqlExec(pool, strsql, null, function (err, records) {
        if (err) {
            callback(err);
        } else {
            if (records && records.length > 0) {
                async.map(records, function (record, next1) {
                    util.getModelFieldValue("order_item", "id", record.id, next1);
                }, function (err, results) {
                    callback(err, results);
                });
            } else {
                callback(null, []);
            }
        }
    });
}

module.exports = user_info;
