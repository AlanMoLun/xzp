var express = require('express');
var mysql = require('mysql');
var redis = require('redis');
var local = require('./local');
var _ = require('../libs/underscore-min.js');

var app_config = {};

app_config.getSocketUrl = function(env){
    var socketUrl = "wss://localhost:8181/";
    switch(env) {
        case 'development':
            socketUrl = "wss://localhost:8181/";
            break;
        case 'production-dev':
            socketUrl = "wss://socket.thebusy.club/";
            break;
        case 'production-tengxunyun':
            socketUrl = "wss://socket.thebusy.club/";
            break;
        default:
    }
    return socketUrl;
};

app_config.mongoDBOptions = function(env){
    var host = '';
    var port = 27017;
    var database = '';
    var user = '';
    var password = '';

    switch(env) {
        case 'development':
            host = '119.29.88.120';
            database = 'group_orders';
            port = 27027;
            user = local.mongodb.user;
            password = local.mongodb.password;
            url = "mongodb://" + user + ":" + password + "@" + host + ":" + port + "/" + database;
            break;
        case 'production-dev':
            host = '172.17.0.1';
            database = 'group_orders';
            port = 27027;
            user = local.mongodb.user;
            password = local.mongodb.password;
            url = "mongodb://" + user + ":" + password + "@" + host + ":" + port + "/" + database;
            break;
        case 'production-tengxunyun':
            host = '172.17.0.1';
            database = 'group_orders';
            user = local.mongodb.user;
            password = local.mongodb.password;
            url = "mongodb://" + user + ":" + password + "@" + host + ":" + port + "/" + database;
            break;
        default:
    }
    return {database: database, host: host, port: port, user: user, password: password, url: url};
};

app_config.initDB = function(env){
    var host = '';
    var database = '';
    var user = '';
    var password = '';
    var timezone = 'UTC';
    var charset = 'utf8mb4';

    switch(env) {
        case 'development':
            host = 'xpzdb1.cno0bmfepeqp.us-east-1.rds.amazonaws.com';
            database = 'tuangou';
            user = local.mysql.user;
            password = local.mysql.password;
            charset = 'utf8mb4';
            break;
        case 'production-dev':
            host = 'xpzdb1.cno0bmfepeqp.us-east-1.rds.amazonaws.com';
            database = 'tuangou';
            user = local.mysql.user;
            password = local.mysql.password;
            charset = 'utf8mb4';
            break;
        case 'production-tengxunyun':
            host = 'xpzdb1.cno0bmfepeqp.us-east-1.rds.amazonaws.com';
            database = 'tuangou';
            user = local.mysql.user;
            password = local.mysql.password;
            charset = 'utf8mb4';
            break;
        default:
    }
    var options = {host: host, database: database, user: user, password: password, timezone: timezone, charset: charset, multipleStatements: false};
    return mysql.createPool(options);
};

app_config.initRedis = function (env) {
    var redisObj = {};
    switch(env) {
        case 'development':
            redisObj.host = '119.29.88.120';
            redisObj.port = '6379';
            redisObj.password = local.redis.password;
            break;
        case 'production-dev':
            redisObj.host = '172.17.0.1';
            redisObj.port = '6379';
            redisObj.password = local.redis.password;
            break;
        case 'production-tengxunyun':
            redisObj.host = '172.17.0.1';
            redisObj.port = '6379';
            redisObj.password = local.redis.password;
            break;
        default:
    }
    return redis.createClient(redisObj);
};

module.exports = app_config;
