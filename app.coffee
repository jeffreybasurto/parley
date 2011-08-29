express = require 'express'
http = require 'http'
port = process.env.PORT || 1337;
app = express.createServer express.logger()

app.set 'view engine', 'eco'
app.set 'view options', { layout: false }

app.post "/message", (request, response) ->
  console.log("Posting!!!!")
  response.send request.body

app.get '/', (request, response) -> 
  response.render 'index'

app.get '/test', (request, response) ->
  options = {
    host: 'localhost',
    port: port,
    path: '/message',
    method: 'POST'
  }
  req = http.request options, (res) -> 
    res.setEncoding('utf8');
    res.on 'data', (chunk) ->
      console.log 'BODY: ' + chunk

  req.write 'data\n'
  req.write 'data\n'
  req.end()
  response.send "Thanks."
  
io = require("socket.io").listen(app)
fs = require("fs")

io.configure () ->  
  io.set "transports", ["xhr-polling"] 
  io.set "polling duration", 10

app.listen port, () -> 
  console.log("Listening on " + port);

io.sockets.on "connection", (socket) ->
  socket.emit "update", messages: "1337"
  socket.on "my other event", (data) ->
    console.log data
