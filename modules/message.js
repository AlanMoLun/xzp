var express = require('express');
var _ = require('../libs/underscore-min.js');
var util = require('../modules/util');
var moment = require('moment-timezone');
var async = require('async');
var mongo_db  = require('../modules/mongo_db.js');
var WebSocketClient = require('websocket').client;

var message = {};

message.send = function(authUser, msgObj, callback){
    msgObj.created_at = moment().utc().format("YYYY-MM-DD HH:mm:ss");
    msgObj.id = util.getTS();
    // console.log("发送到webSocket服务器", msgObj.content);
    async.waterfall([
        function(next){
            if(msgObj && msgObj.content) {
                mongo_db.insertMessage("message", msgObj, next);
            } else {
                next(new Error("provided object is empty"));
            }
        }
    ],function(err){
        sendToSocket(msgObj, function() {
            callback(err, msgObj);
        });
    });
};

message.listByOrderId = function(authUser, orderId, next) {

};

function sendToSocket(msgObj, next) {
    var msgObjToSend = JSON.stringify({orderId: msgObj.orderId, content: msgObj.content});
    var options = {tlsOptions: {rejectUnauthorized: false}};
    var wSocket = new WebSocketClient(options);
    wSocket.connect(socketUrl);
    wSocket.on('connectFailed', function (error) {
        console.log('Connect Error: ' + error.toString());
    });

    wSocket.on('connect', function (connection) {
        console.log('WebSocket Client Connected');
        connection.sendUTF(msgObjToSend, next);

        connection.on('error', function (error) {
            console.log("Connection Error: " + error.toString());
        });

        connection.on('close', function () {
            console.log('Connection Closed');
        });

        // connection.on('message', function(message) {
        //     if (message.type === 'utf8') {
        //         console.log("Received: '" + message.utf8Data + "'");
        //     }
        // });
    });
}

module.exports = message;
