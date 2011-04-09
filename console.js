var mongodb = require("mongodb");

new mongodb.Db("linkedgov", new mongodb.Server("127.0.0.1", 27017, {})).open(function(error, db){
  db.collection("measure", function(error, measure){
    if(error){
      console.error(error);
      db.close();
    }
    db.collection("commodity", function(error, commodity){
      if(error){
        console.error(error);
        db.close();
      }
      
      var repl = require("repl").start("> ");
      repl.context.byCountry = function(name, cb){
        measure.find({ specificCountry: name }, {}, function(error, cursor){
          if(error){
            cb(error);
          }else{
            cursor.toArray(function(error, items){
              if(error){
                cb(error);
              }else{
                cb(null, items);
              }
            });
          }
        });
      };
      
      repl.context.listCountries = function(cb){
        measure.distinct("specificCountry", {}, cb);
      };
      
      repl.context.measureTypes = function(cb){
        measure.distinct("type", {}, cb);
      };
      
      repl.context.byMeasure = function(uri, cb){
        commodity.find({ "hasMeasure.@.rdf:resource": uri }, {}, function(error, cursor){
          if(error){
            cb(error);
          }else{
            cursor.toArray(function(error, items){
              if(error){
                cb(error);
              }else{
                cb(null, items);
              }
            });
          }
        });
      };
      
      repl.context.commoditiesByCountry = function(name, cb){
        repl.context.byCountry(name, function(error, measures){
          if(error){
            cb(error);
            return;
          }
          
          var waiting = measures.length;
          var commodities = [];
          var failed = false;
          measures.forEach(function(m){
            repl.context.byMeasure(m["@"]["rdf:about"], addCommodity);
          });
          
          function addCommodity(error, commodity){
            if(error){
              failed = true;
              cb(error);
            }
            
            if(failed){
              return;
            }
            
            waiting--;
            commodities.push(commodity);
            if(waiting <= 0){
              cb(null, commodities);
            }
          }
        });
      };
    });
  });
});