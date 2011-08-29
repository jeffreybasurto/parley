(function() {
  var app, fs, handler, io;
  handler = function(req, res) {
    return fs.readFile(__dirname + "/index.html", function(err, data) {
      if (err) {
        res.writeHead(500);
        return res.end("Error loading index.html");
      }
      res.writeHead(200);
      return res.end(data);
    });
  };
  app = require("http").createServer(handler);
  io = require("socket.io").listen(app);
  fs = require("fs");
  app.listen(1337);
  io.sockets.on("connection", function(socket) {
    socket.emit("news", {
      hello: "world"
    });
    return socket.on("my other event", function(data) {
      return console.log(data);
    });
  });
}).call(this);
