var express = require('express');
var _ = require('./libs/underscore-min.js');
var app_config = require('./modules/config.js');
var app_env = require('./modules/set_env.js');
var app = express();
var fs = require('fs');

var key = fs.readFileSync('cert/key.pem');
var cert = fs.readFileSync('cert/cert.pem');
var options = {
    key: fs.readFileSync('cert/key.pem'),
    cert: fs.readFileSync('cert/cert.pem')
};
var server = require('https').createServer(options, app);

// var server = require('http').createServer(app);
var webSocketServer = require('websocket').server;
var io = require('socket.io')(server);
var env = app_env.env;

global.cache = app_config.initRedis(env);
global.socketPort = 8181;


//=======================IN PROGRESS DON'T MODIFY HERE=============================
app.set('view engine', 'ejs');

app.get('/ping.html', function (req, res) {
    res.send("ok");
});

app.get('/test', function (req, res) {
    res.render('socket');
});

//Socket
// io.set('transports', ['websocket']);
// io.on('connection', function (socket) {
//     console.log("connected");
//
//     socket.on('chat message', function(msg){
//         io.emit('chat message', msg);
//     });
//
//     socket.on('disconnect', function (data) {
//         console.log("disconnected");
//     });
// });

var wsServer = new webSocketServer({httpServer:server});

wsServer.on('request', function(request) {
    var connection = request.accept(null, request.origin);

    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            connection.send(message.utf8Data);
        }
    });

    connection.on('close', function(connection) {
        console.log("close", connection);
    });
});

server.listen(global.socketPort, function () {
    console.log('Socket start listen on ' + global.socketPort);
});