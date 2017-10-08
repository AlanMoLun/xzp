var express = require('express');
var router = express.Router();
var group_orders = require('../modules/group_orders.js');
var login = require('../modules/login.js');
var cache_manager = require('../modules/cache_manager.js');
var message = require('../modules/message.js');

/* GET home page. */
router.get('/test', function(req, res) {
    var cache_key = cache_manager.keys.userId + "64e5644f41493fcf9f08727a2176d5ee";
    console.log("key1", cache_key);
    cache_manager.getByUserId(cache_key, function(err, reply) {
        res.send(reply);
    });
});

router.get('/', function(req, res) {
  res.render('index', { title: 'World' });
});

router.get('/get', function(req,res) {
      var key = req.query.key;
      var cache = global.cache;
      cache.get(key, function (err, reply) {
        if(reply){
            res.send(reply);
        }else {
          res.send(err);
        }
      });
});

router.get('/getpush', function(req,res) {
    var key = req.query.key;
    cache.LRANGE(key, 0, -1, function (err, reply) {
        res.send(reply);
    });
});

router.get('/get', function(req,res) {
    var key = req.query.key;
    var cache = global.cache;
    cache.get(key, function (err, reply) {
        if(reply){
            res.send(reply);
        }else {
            res.send(err);
        }
    });
});

router.get('/clear', function(req,res) {
    var key = req.query.key;
    var cache = global.cache;
    cache.del(key, function () {
        res.send('OK');
    });
});

router.get('/ajax/order/list', function(req, res) {
    var id = req.query.id;
    group_orders.list(id, function(err, orders){
        if(err){
            res.status(500).json({error: err.message});
        } else {
            res.send(orders);
        }
    });
});

router.get('/ajax/order/list_by_userId', function(req, res) {
    login.checkAuth(req, function(err, auth, authUser){
        if(err) {
            res.status(500).json({error: err.message});
        } else {
            if(auth || isDevelopment) {
                var userId = req.query.userId;
                group_orders.listByUserId(userId, function (err, orders) {
                    if (err) {
                        res.status(500).json({error: err.message});
                    } else {
                        res.send(orders);
                    }
                });
            } else {
                res.status(401).json({error: "Authentication not pass or expired, please login again"});
            }
        }
    });
});

router.post('/ajax/order/update', function(req, res) {
    login.checkAuth(req, function(err, auth, authUser){
        if(err) {
            res.status(500).json({error: err.message});
        } else {
            if(auth || isDevelopment) {
                group_orders.update(req.body.updateObj, function (err, reply) {
                    if (err) {
                        res.status(500).json({error: err.message});
                    } else {
                        res.send(reply);
                    }
                });
            } else {
                res.status(401).json({error: "Authentication not pass or expired, please login again"});
            }
        }
    });
});

router.post('/ajax/order/updatePO', function(req, res) {
    login.checkAuth(req, function (err, auth, authUser) {
        if (err) {
            res.status(500).json({error: err.message});
        } else {
            if (auth || isDevelopment) {
                group_orders.updatePO(req.body.updateObj, function (err, reply) {
                    if (err) {
                        res.status(500).json({error: err.message});
                    } else {
                        res.send(reply);
                    }
                });
            } else {
                res.status(401).json({error: "Authentication not pass or expired, please login again"});
            }
        }
    });
});

router.post('/ajax/order/delete', function(req, res) {
    login.checkAuth(req, function (err, auth, authUser) {
        if (err) {
            res.status(500).json({error: err.message});
        } else {
            if (auth || isDevelopment) {
                group_orders.remove(authUser, req.body.group_order_id, function (err, reply) {
                    if (err) {
                        res.status(500).json({error: err.message});
                    } else {
                        res.send(reply);
                    }
                });
            } else {
                res.status(401).json({error: "Authentication not pass or expired, please login again"});
            }
        }
    });
});

router.post('/ajax/wx/login', function(req, res) {
    login.getAuth(req, function(err, reply){
        if(err) {
            res.status(500).json({error: err.message});
        } else {
            res.send(reply);
        }
    });
});

router.post('/ajax/message/send', function(req, res) {
    login.checkAuth(req, function (err, auth, authUser) {
        if (err) {
            res.status(500).json({error: err.message});
        } else {
            if (auth || isDevelopment) {
                message.send(authUser, req.body.message, function (err, reply) {
                    if (err) {
                        res.status(500).json({error: err.message});
                    } else {
                        res.send(reply);
                    }
                });
            } else {
                res.status(401).json({error: "Authentication not pass or expired, please login again"});
            }
        }
    });
});

router.get('/ajax/message/list_by_orderId', function(req, res) {
    login.checkAuth(req, function(err, auth, authUser){
        if(err) {
            res.status(500).json({error: err.message});
        } else {
            if(auth || isDevelopment) {
                var orderId = req.query.orderId;
                message.listByOrderId(authUser, orderId, function (err, orders) {
                    if (err) {
                        res.status(500).json({error: err.message});
                    } else {
                        res.send(orders);
                    }
                });
            } else {
                res.status(401).json({error: "Authentication not pass or expired, please login again"});
            }
        }
    });
});
module.exports = router;
