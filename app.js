(function() {
  var addCommas, app, express, fs, http, io, port, redis, rtg, socket_list;
  addCommas = function(number) {
    return number.toString().replace(/\B(?=(?:\d{3})+(?!\d))/g, ",");
  };
  express = require('express');
  http = require('http');
  port = process.env.PORT || 1337;
  app = express.createServer(express.logger());
  socket_list = {};
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
  app.post("/message", function(request, response) {
    console.log(socket_list);
    redis.incr("messages");
    redis.get("messages", function(err, val) {
      var sock, _i, _len, _ref, _results;
      if (socket_list["1"]) {
        _ref = socket_list["1"];
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          sock = _ref[_i];
          _results.push(sock.emit("update", {
            messages: addCommas(parseInt(val) + 1000)
          }));
        }
        return _results;
      }
    });
    return response.send("true");
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
    return socket.on("challenge", function(data) {
      var key;
      key = data["key"];
      if (!socket_list[data["key"]]) {
        socket_list[key] = [];
      }
      socket_list[key].push(socket);
      return socket.emit("challenge", {
        response: "1"
      });
    });
  });
}).call(this);
