express = require 'express'
app = express.createServer express.logger()

app.set 'view engine', 'eco'
app.set 'view options', { layout: false }


app.get '/', (request, response) -> 
  response.render 'index'
  
io = require("socket.io").listen(app)
fs = require("fs")

io.configure () ->  
  io.set "transports", ["xhr-polling"] 
  io.set "polling duration", 10

port = process.env.PORT || 1337;
app.listen port, () -> 
  console.log("Listening on " + port);

io.sockets.on "connection", (socket) ->
  socket.emit "news", hello: "world"
  socket.on "my other event", (data) ->
    console.log data
