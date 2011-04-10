var http = require("http"),
    io = require("socket.io"),
    paperboy = require("paperboy"),
    path = require("path"),
    GameManager = require("./lib/game-manager").GameManager;

var manager = new GameManager(JSON.parse(require("fs").readFileSync("game.json", "utf8")));

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
          client: client,
          single: data.single
        };
        client.send({ type: data.type, ok: true, single: !!data.single });
        console.log("Registered user %s, %s", data.name, client.sessionId);
      }
      break;
    case "play":
      if(!data.single && !(data.name in registeredUsers)){
        client.send({ type: data.type, error: "unknown-competitor" });
      }else if(!data.single && (registeredUsers[data.name].game || registeredUsers[data.name].single)){
        client.send({ type: data.type, error: "competitor-playing" });
      }else{
        var us, them;
        us = registeredUsers[client.sessionId];
        if(!data.single){
          them = registeredUsers[data.name];
        }
        us.game = manager.createGame(us, them);
        if(data.single){
          client.send({ type: "playing", single: true });
        }else{
          them.game = us.game;
          client.send({ type: "playing", name: them.name });
          registeredUsers[data.name].client.send({ type: "playing", name: us.name });
        }
        console.log("%s playing %s", us.name, data.single ? "[single]" : them.name);
        us.game.move();
      }
      break;
    case "move":
      var game = registeredUsers[client.sessionId].game;
      if(!game){
        client.send({ type: data.type, error: "no-game" });
      }else{
        game.handleMove(registeredUsers[client.sessionId], data.country);
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