$(function() {

  
  $("#game-setup2").submit(hideGameSetup);
  
  var $nameInput = $("#game-setup2 input[type=text]").val();  
  
  function hideGameSetup(){
    console.log("" + this.username.value);
    if(this.username.value){
      $("#game-setup2").fadeOut("slow");
      console.log("clicked!");
    }
    return false;    
  }



});
