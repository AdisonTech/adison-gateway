
var DDP = require('ddp.js');
var WebSocket = require('faye-websocket').Client;
var Promise = require('bluebird');
var util = require("util");
var events = require("events");

var DdpManager = module.exports = function(siteShortName, meteorServer) {
  this.siteShortName = siteShortName;
  this.meteorServer = meteorServer;
  this.nodes = {};  // mongo _id is key

  events.EventEmitter.call(this);
}

util.inherits(DdpManager, events.EventEmitter);

DdpManager.prototype.connect = function() {
  var self = this;
  return new Promise(function(resolve, reject) {
    var ddpOptions = {
      endpoint: self.meteorServer + '/websocket',
      SocketConstructor: WebSocket
    };

    self.ddp = new DDP(ddpOptions);

    self.ddp.on('connected', function() {
      console.log('ddp connected');
      resolve();
    });

    self.ddp.on('nosub', function(message) {
      console.log('nosub', message);
    });

    self.ddp.on('added', function(message) {
      self.nodes[message.id] = message.fields;
      self.emit('nodeUpdate', message.fields);
    });

    self.ddp.on('changed', function(message) {
      for (var attr in message.fields) {
        self.nodes[message.id][attr] = message.fields[attr];
      }
      self.emit('nodeUpdate', self.nodes[message.id]);
    });

    self.ddp.on('result', function(message) {
      console.log('result', message);
    });

    self.ddp.on('updated', function(message) {
      console.log('updated', message);
    });

  });
}

DdpManager.prototype.subscribe = function() {
  var self = this;
  return new Promise(function(resolve, reject) {
    var subId = self.ddp.sub('nodesForSite', [self.siteShortName]);

    self.ddp.on('ready', function(message) {
      if (message.id = subId) {
        resolve();
      }
    });
  });
}

DdpManager.prototype.sendNode = function(site, node) {
  this.ddp.method('updateNode', [site, node]);  
}

