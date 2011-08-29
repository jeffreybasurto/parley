addCommas = (number) ->
  return number.toString().replace(/\B(?=(?:\d{3})+(?!\d))/g, ",")

express = require 'express'
http = require 'http'
port = process.env.PORT || 1337;
app = express.createServer express.logger()

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
app.use(express.static(__dirname + '/public'))

app.get '/', (request, response) -> 
  redis.get "messages", (err, messages) ->
    messages = addCommas(parseInt(messages) + 1000)
    response.render 'index', { messages }

app.get '/test', (request, response) ->
  response.render 'test'

app.get '/challenge/:channel', (request, response) ->
  console.log("Challenge route hit")
  chan = request.params.channel
  response.render 'challenge', { chan }
  
io = require("socket.io").listen(app)
fs = require("fs")

io.configure () ->  
  io.set "transports", ["xhr-polling"] 
  io.set "polling duration", 10

app.listen port, () -> 
  console.log("Listening on " + port);

io.sockets.on "connection", (socket) ->
  socket.emit("challenge", {response: 1})
  
  app.post "/message", (request, response) ->
    redis.incr("messages")
    redis.get "messages", (err, val)->
      socket.emit "update", messages: addCommas(parseInt(val) + 1000)
    response.redirect('/test');
  # challenge should happen when a new user is connecting to an existing apps channel.
  socket.on "challenge", (data) ->
    socket.emit "challenge", {response: 1}
    console.log data
