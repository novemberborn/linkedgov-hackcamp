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
  //resetGame();
  $("#game-setup2").submit(handleRegistrationSubmit);
  $("#country-list li").click(sendMove);
  ready();
});

function ready(){
  $(document.body).removeClass("loading");
}


function ScrollToGame(location){
  $('html, body').animate({
    scrollTop: ($(location).offset().top) - 30 // 40 = padding/marging... hardcoding this in for time being 
  }, 500);
  console.log("" + ($(location).offset().top) - 400);
  return false;
}

function resetGame(){
  $("#player-details,#game-zone,#country-list ul").hide();
}

function loadGame(){  
  $("#player-details,#game-zone").fadeIn("slow",function(){
      $("#country-list ul").delay(800).fadeIn("slow");  
  });

}


function handleRegistrationSubmit(){
  if(this.username.value){
    register(this.username.value);
    $("#game-setup2").fadeOut("slow", function(){ // wait for fade to happen.. 
      ScrollToGame("#game-zone");
      loadGame();
    });
    

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
  timer.text(remaining);
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
    setTimeout(countdown, 4000);
    $("#current-item h2").text(data.commodity.title);
    $("#current-item p").text("£ " + data.commodity.points);
    $("#country-list li").each(function(ix){
      if(ix < data.countries.length){
        $("input", this).val(this.dataset.country = data.countries[ix]);
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