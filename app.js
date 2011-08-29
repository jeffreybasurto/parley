(function() {
  var addCommas, app, express, fs, http, io, port, redis, rtg, socket_list;
  Array.prototype.remove = function(e) {
    var t, _ref;
    if ((t = this.indexOf(e)) > -1) {
      return ([].splice.apply(this, [t, t - t + 1].concat(_ref = [])), _ref);
    }
  };
  addCommas = function(number) {
    return number.toString().replace(/\B(?=(?:\d{3})+(?!\d))/g, ",");
  };
  express = require('express');
  http = require('http');
  port = process.env.PORT || 1337;
  app = express.createServer(express.logger());
  socket_list = [];
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
    redis.incr("messages");
    redis.get("messages", function(err, val) {
      var sock;
      return sock.emit("update", {
        messages: (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = socket_list.length; _i < _len; _i++) {
            sock = socket_list[_i];
            _results.push(addCommas(parseInt(val) + 1000));
          }
          return _results;
        })()
      });
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
    socket_list.push(socket);
    socket.on("challenge", function(data) {
      return socket.emit("challenge", {
        response: 1
      });
    });
    return socket.on('disconnect', function() {
      return socket_list.remove(socket);
    });
  });
}).call(this);
