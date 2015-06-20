#!/usr/bin/env node

var config = require('./config');
var mqtt = require('mqtt');
var wemo = require('wemo');

var mqttClient  = mqtt.connect(config.mqttServer);
 
mqttClient.on('connect', function () {
  mqttClient.subscribe('presence');
  mqttClient.publish('presence', 'Hello mqtt');
});
 
mqttClient.on('message', function (topic, message) {
  // message is Buffer 
  console.log(message.toString());
});

wemoClient = wemo.Search();

var wemoDevices = {};

wemoClient.on('found', function(device) {
  console.log(device);
  wemoDevices[device.friendlyName] = device;
});

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



