(function() {
  var app, express, http, port, redis, rtg;
  express = require('express');
  http = require('http');
  port = process.env.PORT || 1337;
  app = express.createServer(express.logger());
  app.use(express.bodyParser());
  if (process.env.REDISTOGO_URL) {
    rtg = require("url").parse(process.env.REDISTOGO_URL);
    redis = require("redis").createClient(rtg.port, rtg.hostname);
    redis.auth(rtg.auth.split(":")[1]);
  } else {
    redis = require("redis").createClient();
  }
  redis.on("error", function(err) {
    return console.log("Error " + err);
  });
  app.set('view engine', 'eco');
  app.set('view options', {
    layout: false
  });
  app.use(express.static(__dirname + '/public'));
  app.get('/', function(request, response) {
    return redis.get("messages", function(err, messages) {
      messages = parseInt(messages);
      return response.render('index', {
        messages: messages
      });
    });
  });
  app.get('/test', function(request, response) {
    return response.render('test');
  });
  app.get('/challenge/:channel', function(request, response) {
    var chan;
    console.log("Challenge route hit");
    chan = request.params.channel;
    return response.render('challenge', {
      chan: chan
    });
  });
  app.post("/message", function(request, response) {
    var sock, _i, _len, _ref;
    redis.lpush("1", request.body.message);
    redis.publish("1", "ready");
    _ref = socket_list[request.body.key] || [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      sock = _ref[_i];
      sock.emit("update", {
        messages: request.body.message
      });
    }
    return response.send("true");
  });
  app.listen(port, function() {
    return console.log("Listening on " + port);
  });
}).call(this);
