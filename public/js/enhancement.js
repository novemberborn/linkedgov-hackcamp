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
  resetGame();
  $("#game-setup2").submit(handleRegistrationSubmit);
  $("#country-list li").click(sendMove);
  $("#about-selling").hide(); 
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
  $("#player-details,#game-zone,#country-list ul,#end-screen, #congrats, #bankrupt").hide();
}

function loadGame(){
  var proceeded = false;
  $("#player-details,#game-zone").fadeIn("slow",function(){
      if(proceeded){ return; }
      proceeded = true;
      $("#country-list ul").delay(2000).fadeIn("slow");  
      $("#about-money").delay(2200).fadeOut("slow",function(){
        $("#about-selling").fadeIn("slow",function(){
            $("#about-selling").delay(2800).fadeOut("slow");
        });
      });
  });
}


function handleRegistrationSubmit(){
  if(this.username.value){
    register(this.username.value);
    $("#game-setup2").fadeOut("slow", function(){ // wait for fade to happen.. 
      $("#banner").text("").css({"margin": "0", "height": "0"});
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
  var remaining = 20;
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
    setTimeout(countdown, 8000);
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
    $("#count-down .timer").hide();
    if(data.bankrupt){
      $("#bankrupt").show();
    }else if(data.byPoints){
      alert("You lost, the other player had more money");
    }
    $("#player-details").fadeOut("slow");
    $("#game-zone").fadeOut("slow", function(){
      $("#end-screen").fadeIn();
    });
  }
};

Commands["ftw"] = {
  exec: function(data){
    updateCash(data.points);
    $("#count-down .timer").hide();
    if(data.bankrupt){
      alert("The other player was bankrupted");
    }else if(data.byPoints){
      alert("You beat the other player by having more money");
    }else if(data.tie){
      alert("You tied.");
    }else if(data.single){
      $("#congrats p").text("You smuggled £" + data.points + "!");
      $("#congrats").show();
    }
    $("#player-details").fadeOut("slow");
    $("#game-zone").fadeOut("slow", function(){
      $("#end-screen").fadeIn();
    });
  }
};