(function() {
  var app, express, fs, http, io, port, redis, rtg;
  express = require('express');
  http = require('http');
  port = process.env.PORT || 1337;
  app = express.createServer(express.logger());
  console.log(process.env);
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
  app.get('/', function(request, response) {
    return redis.get("messages", function(err, messages) {
      console.log(messages);
      return response.render('index', {
        messages: messages
      });
    });
  });
  app.get('/test', function(request, response) {
    var options, req;
    options = {
      host: process.env.HOST || "localhost",
      port: port,
      path: '/message',
      method: 'POST'
    };
    req = http.request(options, function(res) {
      res.setEncoding('utf8');
      return res.on('data', function(chunk) {
        return console.log('BODY: ' + chunk);
      });
    });
    req.write('data\n');
    req.write('data\n');
    req.end();
    return response.send("Message sent.");
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
          messages: val
        });
      });
      return response.send(request.body);
    });
    return socket.on("my other event", function(data) {
      return console.log(data);
    });
  });
}).call(this);
