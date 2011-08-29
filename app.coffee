handler = (req, res) ->
  fs.readFile __dirname + "/public/index.html", (err, data) ->
    if err
      return res.writeHead 500
      return res.end("Error loading index.html")
    res.writeHead 200
    res.end data

app = require("http").createServer(handler)
io = require("socket.io").listen(app)
fs = require("fs")

port = process.env.PORT || 1337;
app.listen port, () -> 
  console.log("Listening on " + port);

io.sockets.on "connection", (socket) ->
  socket.emit "news", hello: "world"
  socket.on "my other event", (data) ->
    console.log data
