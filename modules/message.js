var express = require('express');
var _ = require('../libs/underscore-min.js');
var util = require('../modules/util');
var local = require('./local');
var moment = require('moment-timezone');
var webSocket = require('ws');
var async = require('async');
var mongo_db  = require('../modules/mongo_db.js');

var message = {};

message.send = function(authUser, msgObj, callback){
    msgObj.created_at = moment().utc().format("YYYY-MM-DD HH:mm:ss");
    msgObj.id = util.getTS();
    console.log("发送到webSocket服务器", msgObj.content);
    async.waterfall([
        function(next){
            if(msgObj && msgObj.content) {
                mongo_db.insertMessage("message", msgObj, next);
            } else {
                next(new Error("provided object is empty"));
            }
        }
    ],function(err){
        sendToSocket(msgObj.content, function() {
            callback(err, msgObj);
        });
    });
};

message.listByOrderId = function(authUser, orderId, next) {

};

function sendToSocket(content, next){
    var socket = new webSocket(socketUrl,{rejectUnauthorized: false});
    socket.on('open', function open() {
        socket.send(content);
        next(null);
    });
}

module.exports = message;
