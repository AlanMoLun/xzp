var express = require('express');
var _ = require('./libs/underscore-min.js');
var util = require('./modules/util');
var app_config = require('./modules/config.js');
var app_env = require('./modules/set_env.js');
var message = require('./modules/message.js');
var app = express();
var fs = require('fs');

var options = {
    key: fs.readFileSync('cert/key.pem'),
    cert: fs.readFileSync('cert/cert.pem')
};
var server = require('https').createServer(options, app);
var webSocketServer = require('websocket').server;
var env = app_env.env;

global.cache = app_config.initRedis(env);
global.socketPort = 8181;

//====================================================
app.set('view engine', 'ejs');

app.get('/ping.html', function (req, res) {
    res.send("ok");
});

app.get('/test', function (req, res) {
    res.render('socket');
});

var wsServer = new webSocketServer({httpServer:server});
var wSockets = [];

wsServer.on('request', function(request) {
    var connection = request.accept(null, request.origin);
    connection.on('message', function (msgObj) {
        if (msgObj && msgObj.type === 'utf8' && msgObj.utf8Data) {
            var utf8Data = util.parseJSON(msgObj.utf8Data);
            var orderId = utf8Data.orderId;
            if(!connection.orderId) {
                connection.orderId = orderId;
                // console.log("客户端连接:", orderId);
                wSockets.push(connection);
            }

            console.log("sockets:", wSockets.length);

            if (utf8Data.content) {
                rooms = _.where(wSockets, {orderId: orderId});
                rooms.map(function (room) {
                    // console.log("服务器发出:", msgObj);
                    room.sendUTF(utf8Data.content);
                });
            }
        }
    });

    connection.on('close', function (connection) {
        console.log("close", connection);
        console.log("wSockets", wSockets.orderId);
        // wSockets = _.reject(wSockets, function(wSocket) { return wSocket.orderId != "orderId"; });
    });
});

server.listen(global.socketPort, function () {
    console.log('Socket start listen on ' + global.socketPort);
});