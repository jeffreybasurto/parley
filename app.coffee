express = require 'express'
http = require 'http'
port = process.env.PORT || 1337;
app = express.createServer express.logger()
console.log(process.env)
if (process.env.REDISTOGO_URL) 
  rtg   = require("url").parse(process.env.REDISTOGO_URL)
  redis = require("redis").createClient(rtg.port, rtg.hostname)
  redis.auth(rtg.auth.split(":")[1])
else 
  redis = require("redis").createClient()

redis.on "error", (err)-> 
  console.log("Error " + err)

app.set 'view engine', 'eco'
app.set 'view options', { layout: false }

app.get '/', (request, response) -> 
  redis.get "messages", (err, messages) ->
    console.log(messages)
    response.render 'index', { messages }

app.get '/test', (request, response) ->
  response.send "Message sent."
  
io = require("socket.io").listen(app)
fs = require("fs")

io.configure () ->  
  io.set "transports", ["xhr-polling"] 
  io.set "polling duration", 10

app.listen port, () -> 
  console.log("Listening on " + port);

io.sockets.on "connection", (socket) ->
  app.post "/message", (request, response) ->
    redis.incr("messages")
    redis.get "messages", (err, val)->
      socket.emit "update", messages: val 
    response.redirect('/');
  socket.on "my other event", (data) ->
    console.log data
