var xml2js = require("xml2js"),
    fs = require("fs"),
    mongodb = require("mongodb"),
    path = require("path");

parse(process.argv[2]);

function parse(src){
  var start;
  var parser = new xml2js.Parser;
  parser.on("end", function(data){
    console.log("Parsed in %sms", Date.now() - start);
    // console.log(JSON.stringify(data, null, 2));
    new mongodb.Db("linkedgov", new mongodb.Server("127.0.0.1", 27017, {})).open(function(error, db){
      if(error){
        console.error(error);
        return;
      }
      
      db.createCollection(path.basename(src, ".rdf"), function(error, collection){
        if(error){
          console.error(error);
          db.close();
          return;
        }
        var waiting = data["rdf:Description"].length;
        data["rdf:Description"].forEach(function(item){
          collection.insert(item, { safe: true }, inserted);
        });
        
        function inserted(error){
          if(error){
            console.error(error);
          }
          waiting--;
          if(waiting <= 0){
            console.log("Inserted %s items", data["rdf:Description"].length);
            db.close();
          }
        }
      });
    });
  });
  
  fs.readFile(src, "utf8", function(error, data){
    if(error){
      console.error(error);
    }else{
      start = Date.now();
      parser.parseString(data);
    }
  });
}