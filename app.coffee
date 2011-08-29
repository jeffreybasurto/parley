Array::remove = (e) -> @[t..t] = [] if (t = @indexOf(e)) > -1

express = require 'express'
http = require 'http'
port = process.env.PORT || 1337;
app = express.createServer express.logger()
socket_list = {}

app.use(express.bodyParser());

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
    messages = parseInt(messages)
    response.render 'index', { messages }

app.get '/test', (request, response) ->
  response.render 'test'

app.get '/challenge/:channel', (request, response) ->
  console.log("Challenge route hit")
  chan = request.params.channel
  response.render 'challenge', { chan }
  
app.post "/message", (request, response) ->
  redis.incrby("messages", 1 + (socket_list["1"] || []).length()) # counting message we're delivering to web page that subs all messages.
  redis.get "messages", (err, val)->
    sock.emit("update", messages: parseInt(val)) for sock in (socket_list["1"] || [])    
  # we could add the value to a redis queue @ the key for another app to consume.
  # but for simplicty for now let's just act upon it.
  if socket_list[request.body.key]
    sock.emit("update", messages: request.body.message) for sock in socket_list[request.body.key]
  else
    console.log("No socket list for key:" + request.body.key)
    
  response.send("true")
  
io = require("socket.io").listen(app)
fs = require("fs")

io.configure () ->  
  io.set "transports", ["xhr-polling"] 
  io.set "polling duration", 10

app.listen port, () -> 
  console.log("Listening on " + port);

io.sockets.on "connection", (socket) ->  
  # challenge should happen when a new user is connecting to an existing apps channel.
  socket.on "challenge", (data) ->
    key = data["key"]
    socket_list[key] = [] unless socket_list[data["key"]] 
    socket_list[key].push socket
    # subscript to a specific group. 
    console.log("Challenge for key:" + key)
    socket.set 'key', key,  () -> socket.emit "challenge", {response: "1"}
    
  socket.on 'disconnect', () ->
    console.log ("disconnecting socket.")
    socket.get 'key', (err, key) -> socket_list[key].remove(socket) if key && socket_list[key]
    # socket_list.remove socket
        
        