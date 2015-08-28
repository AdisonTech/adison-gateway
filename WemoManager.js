
var Wemo = require('wemo-client');
var Promise = require('bluebird');
var util = require("util");
var events = require("events");

// node is object of objects. Key is friendlyName
//  -- type (bridge, insight, bulb)
//  -- ip
//  -- deviceId

function translateType(deviceType) {
  if (/bridge/.exec(deviceType)) {
    return 'bridge';
  }
}

var WemoManager = module.exports = function() {
  events.EventEmitter.call(this);
  this.wemo = new Wemo();
  this.nodes = [];
  this.nodeIndex = {};
}

util.inherits(WemoManager, events.EventEmitter);

WemoManager.prototype.queueUpdateNodesEvent = function() {
  // this function is used to signal up the stack.
  // we use a timer so that we don't fire a ton of events
  // during device discovery.
  this.emit('nodesUpdate', this.nodes);
  /*
  if (!this.updateNodeTimer) {
    var that = this;
    this.updateNodeTimer = setTimeout(function() {
      that.emit('nodesUpdate', that.nodes);
      this.updateNodeTimer = null;
    }, 1000);
  }
  */
}

WemoManager.prototype.updateNode = function(deviceId, props) {
  if (deviceId in this.nodeIndex) {
    // merge into existing node
    var i = this.nodeIndex[deviceId];
    for (var p in props) {
      this.nodes[i][p] = props[p];
    }
  } else {
    // create a new node
    props.deviceId = deviceId;
    this.nodes.push(props);
    this.nodeIndex[deviceId] = this.nodes.length - 1;
  } 
}

WemoManager.prototype.discover = function() {
  console.log('Wemo discovery ...');
  var that = this;
  this.wemo.discover(function(deviceInfo) {
    var deviceId = deviceInfo.UDN;

    that.updateNode(deviceId, {
      friendlyName:deviceInfo.friendlyName,
      type:translateType(deviceInfo.deviceType),
      ip: deviceInfo.host,
      deviceId: deviceId
    });

    that.queueUpdateNodesEvent();

    // Get the client for the found device
    var client = that.wemo.client(deviceInfo);

    client.getEndDevices(function(err, end) {
      end.forEach(function(e) {
        that.updateNode(e.deviceId, {
          friendlyName: e.friendlyName,
          type: 'bulb',
          deviceId: e.deviceId,
          binaryState: e.internalState['10006'],
          brightness: /(\d*):/.exec(e.internalState['10008'])[1]/255
        });
        that.queueUpdateNodesEvent();
      });
    });

    // Handle BinaryState events
    client.on('binaryState', function(value) {
      that.updateNode(deviceId, {binaryState: value});
      that.emit('nodesUpdate', that.nodes);
    });

    client.on('statusChange', function(dev, cap, value) {
      if (cap === '10008') {
        that.updateNode(dev, {brightness: /(\d*):/.exec(value)[1]/255});
        that.emit('nodesUpdate', that.nodes);
      } else if (cap === '10006') {
        that.updateNode(dev, {binaryState: value});
        that.emit('nodesUpdate', that.nodes);
      }
    });
  });
}

