"use strict";

module.exports = (function() {

  var util = require("util");
  var EventEmitter = require("events").EventEmitter;
  var http = require('http');

  function parseData(data, cb) {
	  
	var parseResult = {};
	var arr = data.split('&');
	
	for(var i = 0; i < arr.length; i++) {
		
		var key = arr[i].slice(0, arr[i].indexOf('='));
		var value = arr[i].slice(arr[i].indexOf('=')+1);
		parseResult[key] = value;
		
	}	
	
	cb(parseResult);
   
  }
 
  function isMonitored(deviceId) {
    var monitored = -1;
	
    for (var i = 0; i < this._config.sensors.length; i++) {
		
      if (this._config.sensors[i].deviceId === deviceId) {
        monitored = i;
        break;
      }
	  
    }
	
    return monitored;
  }

 

  function AndroidDriver(config) {

    console.log("creating Android adapter");

    EventEmitter.call(this);
    this._config = config;
	this._server = null;

  }

  util.inherits(AndroidDriver, EventEmitter);

  AndroidDriver.prototype.start = function() {

    console.log("starting Android Adapter");

    // Create a new server and provide a callback for when a connection occurs
    var this._server = http.createServer(function (req, res) {
		
		if ((req.url == '/') && (req.method == 'POST')) {
			
			var data = '';
			
			req.on('data', function(chunk) {
			  console.log("Received body data:");
				data += chunk.toString();
			});
			
			req.on('end', function() {
			  // empty 200 OK response for now
			  res.writeHead(200, "OK", {'Content-Type': 'text/html'});
			
			  parse(data, function(parseResult) {
				  
				var sensorIdx = isMonitored.call(self, parseResult.deviceId);
				
				if (sensorIdx >= 0) {
				  self.emit("data", self._config.sensors[sensorIdx].feedId, parseResult);
				} else {
				  console.log("ignoring data from device %s - not found in config",parseResult.deviceId);
				}
				
			  });
			  
			  res.end();
			});
			
		} else {
			res.writeHead(501, "Not implemented", {'Content-Type': 'text/html'});
			res.end('<html><head><title>501 - Not implemented</title></head><body><h1>Not implemented!</h1></body></html>');
		}
	});
	
	this._server.listen(this._config.port);

    
  };

  AndroidDriver.prototype.stop = function() {
    this._server.close(); // close server
  };

  return AndroidDriver;
}());