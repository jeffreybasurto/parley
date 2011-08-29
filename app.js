(function() {
  var app, express, fs, io, port;
  express = require('express');
  app = express.createServer(express.logger());
  app.get('/', function(request, response) {
    return response.send('Hello World!');
  });
  io = require("socket.io").listen(app);
  fs = require("fs");
  io.configure(function() {
    io.set("transports", ["xhr-polling"]);
    return io.set("polling duration", 10);
  });
  port = process.env.PORT || 1337;
  app.listen(port, function() {
    return console.log("Listening on " + port);
  });
  io.sockets.on("connection", function(socket) {
    socket.emit("news", {
      hello: "world"
    });
    return socket.on("my other event", function(data) {
      return console.log(data);
    });
  });
}).call(this);
