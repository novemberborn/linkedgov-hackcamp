var http = require("http"),
    io = require("socket.io"),
    paperboy = require("paperboy"),
    path = require("path");

server = http.createServer(function(req, res){
  paperboy.deliver(path.join(__dirname, "public"), req, res);
});

server.listen(8080);

var socket = io.listen(server);
socket.on("connection", function(client){
  client.on("message", onClientMessage.bind(this, client));
  client.on("disconnect", onClientDisconnect.bind(this, client));
});

var registeredUsers = {};
function onClientMessage(client, data){
  switch(data.type){
    case "register-user":
      if(data.name in registeredUsers){
        client.send({ type: data.type, error: "name-taken" });
      }else{
        registeredUsers[client.sessionId] = registeredUsers[data.name] = {
          name: data.name,
          client: client
        };
        client.send({ type: data.type, ok: true });
        console.log("Registered user %s, %s", data.name, client.sessionId);
      }
      break;
    case "play":
      if(!(data.name in registeredUsers)){
        client.send({ type: data.type, error: "unknown-competitor" });
      }else{
        var us = registeredUsers[client.sessionId], them = registeredUsers[data.name];
        us.playing = them;
        them.playing = us;
        client.send({ type: "playing", name: them.name });
        registeredUsers[data.name].client.send({ type: "playing", name: us.name });
      }
      break;
  }
};

function onClientDisconnect(client){
  delete registeredUsers[client.sessionId];
  Object.keys(registeredUsers).some(function(name){
    if(registeredUsers[name].client === client){
      delete registeredUsers[name];
      return true;
    }
  });
}