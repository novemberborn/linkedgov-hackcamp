var Commands = {};
socket = new io.Socket();
socket.connect();
socket.on("connect", ready);
socket.on("message", function(data){
  var command = Commands[data.type];
  if(!command){
    return;
  }
  
  if(data.error){
    command.error && command.error(data);
    return;
  }
  
  command.exec(data);
});

$(function() {
  $("#game-setup2").submit(handleRegistrationSubmit);
  $("#country-list li").click(sendMove);
  ready();
});

function ready(){
  $(document.body).removeClass("loading");
}

function handleRegistrationSubmit(){
  if(this.username.value){
    register(this.username.value);
    $("#game-setup2").fadeOut("slow");
  }
  return false;
}

function sendMove(){
  var country = $("input", this).val();
  socket.send({ type: "move", country: country });
  return false;
}

function register(name){
  socket.send({ type: "register-user", name: name, single: true });
  $("#player-details h2").text(name);
}

function updateCash(points){
  $("#player-details .cash").text("£ " + points).addClass(points < 0 ? "bankrupt" : "");
}

function countdown(){
  clearInterval(countdown.interval);
  var timer = $("#count-down .timer");
  var remaining = 10;
  timer.text(10);
  countdown.interval = setInterval(function(){
    remaining--;
    if(remaining >= 0){
      timer.text(remaining);
    }
    if(remaining <= 0){
      clearInterval(countdown.interval);
      socket.send({ type: "move", country: "pass" });
    }
  }, 1000);
}

Commands["register-user"] = {
  exec: function(data){
    if(data.single){
      socket.send({ type: "play", single: true });
    }
  }
};

Commands["move"] = {
  exec: function(data){
    updateCash(data.points);
    countdown();
    $("#current-item h2").text(data.commodity.title);
    $("#current-item p").text("£ " + data.commodity.points);
    $("#country-list li").each(function(ix, li){
      if(ix < data.countries.length){
        $("input", li).val(data.countries[ix]);
      }
    });
  }
};

Commands["fml"] = {
  exec: function(data){
    updateCash(data.points);
    if(data.bankrupt){
      alert("You were bankrupted");
    }else if(data.byPoints){
      alert("You lost, the other player had more money");
    }
  }
};

Commands["ftw"] = {
  exec: function(data){
    updateCash(data.points);
    if(data.bankrupt){
      alert("The other player was bankrupted");
    }else if(data.byPoints){
      alert("You beat the other player by having more money");
    }else if(data.tie){
      alert("You tied.");
    }else if(data.single){
      alert("Finished single game");
    }
  }
};