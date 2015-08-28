#!/usr/bin/env node

var config = require('./config');
var ddpManager = require('./DdpManager.js');
var wemoManager = require('./WemoManager.js');
var Promise = require('bluebird');

// data structure that contains the local "database"
// for a site
var site = {};

var ddp = new ddpManager(config.siteShortName, config.meteorServer);
var wemo = new wemoManager();

ddp.on('siteUpdated', function(site) {
  console.log('siteUpdated', site);
});

wemo.on('nodesUpdate', function(nodes) {
  console.log('nodesUpdate', nodes);
});

ddp.connect()
.then(ddp.subscribe())
.then(function() {
  console.log('DDP subscribed');
  wemo.discover();
});


/*
setInterval(function() {
  for (var name in wemoDevices) {
    var d = wemoDevices[name];
    var wemoSwitch = new wemo(d.ip, d.port);
    wemoSwitch.getBinaryState(function(err, result) {
      if (err) {
        console.log('Error reading ' + name + err);
      } else {
        var topicBase = 'node/' + config.siteShortName + '/wemo/' + name + '/';
        mqttClient.publish(topicBase + 'modelName', d.modelName);
        mqttClient.publish(topicBase + 'binaryState', result);
      }
    });

  }
}, 3000);

*/


