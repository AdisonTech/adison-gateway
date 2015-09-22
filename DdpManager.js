
var DDP = require('ddp.js');
var WebSocket = require('faye-websocket').Client;
var Promise = require('bluebird');
var util = require("util");
var events = require("events");

var DdpManager = module.exports = function(siteShortName, meteorServer) {
  this.siteShortName = siteShortName;
  this.meteorServer = meteorServer;
  this.site = {};

  events.EventEmitter.call(this);
}

util.inherits(DdpManager, events.EventEmitter);

DdpManager.prototype.connect = function() {
  var that = this;
  return new Promise(function(resolve, reject) {
    var ddpOptions = {
      endpoint: that.meteorServer + '/websocket',
      SocketConstructor: WebSocket
    };

    that.ddp = new DDP(ddpOptions);

    that.ddp.on('connected', function() {
      console.log('ddp connected');
      resolve();
    });

    that.ddp.on('nosub', function(message) {
      console.log('nosub', message);
    });

    that.ddp.on('added', function(message) {
      if (message.collection === 'sites') {
        that.site = message.fields;
      }
      that.emit('siteUpdated', that.site);
    });

    that.ddp.on('changed', function(message) {
      // merge changes to local object
      for (var attr in message.fields) {
        that.site[attr] = message.fields[attr];
      }
      that.emit('siteUpdated', that.site);
    });

    that.ddp.on('result', function(message) {
      console.log('result', message);
    });

    that.ddp.on('updated', function(message) {
      console.log('updated', message);
    });

  });
}

DdpManager.prototype.subscribe = function() {
  var that = this;
  return new Promise(function(resolve, reject) {
    var subId = that.ddp.sub('site', [that.siteShortName]);

    that.ddp.on('ready', function(message) {
      if (message.id = subId) {
        resolve();
      }
    });
  });
}

DdpManager.prototype.sendSite = function(site, nodes) {
  this.ddp.method('updateNodes', [site, nodes]);  
}

