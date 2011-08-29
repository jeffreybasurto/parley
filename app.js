(function() {
  var app, express, fs, http, io, port;
  express = require('express');
  http = require('http');
  port = process.env.PORT || 1337;
  app = express.createServer(express.logger());
  app.set('view engine', 'eco');
  app.set('view options', {
    layout: false
  });
  app.post("/message", function(request, response) {
    console.log("Posting!!!!");
    return response.send(request.body);
  });
  app.get('/', function(request, response) {
    return response.render('index');
  });
  app.get('/test', function(request, response) {
    var options, req;
    options = {
      host: 'localhost',
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
    return response.send("Thanks.");
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
    socket.emit("update", {
      messages: "1337"
    });
    return socket.on("my other event", function(data) {
      return console.log(data);
    });
  });
}).call(this);
