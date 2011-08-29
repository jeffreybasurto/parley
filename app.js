(function() {
  var addCommas, app, express, fs, http, io, port, redis, rtg;
  addCommas = function(number) {
    return number.toString().replace(/\B(?=(?:\d{3})+(?!\d))/g, ",");
  };
  express = require('express');
  http = require('http');
  port = process.env.PORT || 1337;
  app = express.createServer(express.logger());
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
      messages = addCommas(parseInt(messages) + 1000);
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
  io = require("socket.io").listen(app);
  fs = require("fs");
  io.configure(function() {
    io.set("transports", ["xhr-polling"]);
    return io.set("polling duration", 10);
  });
  app.listen(port, function() {
    return console.log("Listening on " + port);
  });
  io.sockets.on("connection", function(socket) {
    app.post("/message", function(request, response) {
      redis.incr("messages");
      redis.get("messages", function(err, val) {
        return socket.emit("update", {
          messages: addCommas(parseInt(val) + 1000)
        });
      });
      return response.send("true");
    });
    return socket.on("challenge", function(data) {
      return socket.emit("challenge", {
        response: 1
      });
    });
  });
}).call(this);
