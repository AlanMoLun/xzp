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
global.pub = app_config.initRedis(env);
global.sub = app_config.initRedis(env);
global.socketPort = 8181;

//======================Health Check and other endpoints==============================
app.set('view engine', 'ejs');

app.get('/ping.html', function (req, res) {
    res.send("ok");
});

app.get('/test', function (req, res) {
    res.render('socket');
});

//============================ Redis pub and sub ==============================================
sub.subscribe("EVENT BUS");
sub.on("message", function (channel, event) {
    event = util.parseJSON(event);
    switch (event.type) {
        case 'message':
            var message = event.payload;
            var roomId = message.orderId;
            var content = message.content;
            sendToRoom(roomId, content);
            break;
        default:
    }
});

//============================ WebSocket ==============================================
var wsServer = new webSocketServer({httpServer:server});
var wSockets = {};
var connection_id = 0;

wsServer.on('request', function(request) {
    var connection = request.accept(null, request.origin);
    connection.on('message', function (msgObj) {
        if (msgObj && msgObj.type === 'utf8' && msgObj.utf8Data) {
            var utf8Data = util.parseJSON(msgObj.utf8Data);
            var roomId = utf8Data.orderId;
            if(!connection.roomId) {
                connection.roomId = roomId;
                connection.id = connection_id++;
                if (!wSockets[roomId]) {
                    wSockets[roomId] = [];
                }
                wSockets[roomId].push(connection);
            }
            console.log("number of sockets:", wSockets[roomId].length);
            console.log("connection id:", connection.id);
        }
    });

    connection.on('close', function (reasonCode, description) {
        console.log("connection close...", connection.id);
        closeConnection(connection);
    });
});

function closeConnection(connection) {
    var roomId = connection.roomId;
    wSockets[roomId] = _.reject(wSockets[roomId], function(wSocket) { return wSocket.id == connection.id; });
    // console.log("number of sockets:", wSockets[roomId].length);
    if(wSockets[roomId].length == 0){
        delete wSockets[roomId];
        if(_.isEmpty(wSockets)){
            // console.log("id reset");
            connection_id = 0;
        }
    }
}

function sendToRoom(roomId, content) {
    wSockets[roomId].map(function (wSocket) {
        wSocket.sendUTF(content);
    });
}

server.listen(global.socketPort, function () {
    console.log('Socket start listen on ' + global.socketPort);
});