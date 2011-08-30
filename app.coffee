
express = require 'express'
http = require 'http'
port = process.env.PORT || 1337;
app = express.createServer express.logger()

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
  redis.lpush("1", request.body.message)
  # publish based on the secrety key.  1 for testing for now TODO
  redis.publish("1", "ready")
  # we could add the value to a redis queue @ the key for another app to consume.
  # but for simplicty for now let's just act upon it.
  sock.emit("update", messages: request.body.message) for sock in (socket_list[request.body.key] || [])    
  response.send("true")
  

app.listen port, () -> 
  console.log("Listening on " + port);

        
        