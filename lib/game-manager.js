exports.GameManager = GameManager;
function GameManager(definition){
  this.rounds = definition.rounds;
  this.initialPoints = definition.initialPoints;
  this.commodities = definition.commodities;
  this.countries = definition.countries;
}

GameManager.prototype.createGame = function(playerA, playerB){
  return new Game(this, playerA, playerB);
};

function Game(manager, playerA, playerB){
  this.rounds = manager.rounds;
  this.commodities = manager.commodities.slice().sort(function(){ return Math.random() < .5 ? -1 : 1; });
  this.countries = manager.countries;
  this.playerA = playerA;
  this.playerB = playerB;
  this.single = !playerB;
  this.points = {
    playerA: manager.initialPoints,
    playerB: manager.initialPoints
  };
}

Game.prototype.move = function(){
  if(this.rounds === 0 || this.points.playerA <= 0 || !this.single && this.points.playerB <= 0){
    this.finish();
    return;
  }
  
  this.rounds--;
  var commodity = this.commodities.pop();
  this._currentMove = {
    _commodity: commodity,
    commodity: {
      title: commodity.title,
      points: commodity.points
    },
    countries: this.countries.sort(function(){ return Math.random() < .5 ? -1 : 1; }).slice(0, 6)
  };
  this.playerA.client.send({ type: "move", commodity: this._currentMove.commodity, countries: this._currentMove.countries, points: this.points.playerA });
  !this.single && this.playerB.client.send({ type: "move", commodity: this._currentMove.commodity, countries: this._currentMove.countries, points: this.points.playerB });
};

Game.prototype.handleMove = function(player, countryName){
  var player = this.playerA === player ? "playerA" : "playerB";
  if(this._currentMove[player]){
    // Already played, ignore.
    return;
  }
  
  this._currentMove[player] = true;
  if(countryName !== "pass"){
    var commodity = this._currentMove._commodity;
    var country = commodity.countries[countryName] || {
      risk: 0,
      multiplier: 1
    };
    var caught = Math.random() < country.risk;
    this.points[player] += this._currentMove.commodity.points * country.multiplier * (caught ? -1 : 1);
  }
  
  if(this._currentMove.playerA && this.single || this._currentMove.playerB){
    this.move();
  }
};

Game.prototype.finish = function(){
  if(this.points.playerA <= 0){
    this.playerA.client.send({ type: "fml", bankrupt: true, points: this.points.playerA });
    !this.single && this.playerB.client.send({ type: "ftw", bankrupt: true, points: this.points.playerB });
  }else if(this.single){
    this.playerA.client.send({ type: "ftw", single: true, points: this.points.playerA });
  }else if(this.points.playerB <= 0){
    this.playerA.client.send({ type: "ftw", bankrupt: true, points: this.points.playerA });
    this.playerB.client.send({ type: "fml", bankrupt: true, points: this.points.playerB });
  }else{
    var winner = this.points.playerA == this.points.playerB ? "tie" : this.points.playerA > this.points.playerB ? "playerA" : "playerB";
    if(winner === "tie"){
      this.playerA.client.send({ type: "ftw", tie: true, points: this.points.playerA });
      this.playerB.client.send({ type: "ftw", tie: true, points: this.points.playerB });
    }else if(winner === "playerA"){
      this.playerA.client.send({ type: "ftw", byPoints: true, points: this.points.playerA });
      this.playerB.client.send({ type: "fml", byPoints: true, points: this.points.playerB });
    }else if(winner === "playerB"){
      this.playerA.client.send({ type: "fml", byPoints: true, points: this.points.playerA });
      this.playerB.client.send({ type: "ftw", byPoints: true, points: this.points.playerB });
    }
  }
};