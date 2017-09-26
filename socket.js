var express = require('express');
var _ = require('./libs/underscore-min.js');
var app_config = require('./modules/config.js');
var app_env = require('./modules/set_env.js');
var os = require("os");
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var env = app_env.env;
var fs = require('fs');

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
io.set('transports', ['websocket']);
io.on('connection', function (socket) {
    console.log("connected");

    socket.on('chat message', function(msg){
        io.emit('chat message', msg);
    });

    socket.on('disconnect', function (data) {
        console.log("disconnected");
    });
});

server.listen(global.socketPort, function () {
    console.log('Socket start listen on ' + global.socketPort);
});