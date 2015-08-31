
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
  this.wemoClients = {};
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

    that.wemoClients[deviceId] = client;

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
        that.wemoClients[e.deviceId] = client;
      });
    });

    // Handle BinaryState events
    client.on('binaryState', function(value) {
      that.updateNode(deviceId, {binaryState: value, cmdBinaryState: value});
      that.emit('nodesUpdate', that.nodes);
    });

    client.on('statusChange', function(dev, cap, value) {
      if (cap === '10008') {
        var b = /(\d*):/.exec(value)[1]/255;
        that.updateNode(dev, {brightness:b, cmdBrightness:b});
        that.emit('nodesUpdate', that.nodes);
      } else if (cap === '10006') {
        that.updateNode(dev, {binaryState: value, cmdBinaryState: value});
        that.emit('nodesUpdate', that.nodes);
      }
    });
  });
}

WemoManager.prototype.setBulbBinaryState = function(devId, state) {
  if (devId in this.wemoClients) {
    console.log('setting ' + devId + ' ' + state);
    this.wemoClients[devId].setDeviceStatus(devId, '10006', state);
  }
}


WemoManager.prototype.setBulbBrightness = function(devId, brightness) {
  if (devId in this.wemoClients) {
    console.log('setting ' + devId + ' ' + brightness*100 + '%');
    this.wemoClients[devId].setDeviceStatus(devId, '10008', brightness*255);
  }
}

WemoManager.prototype.update = function(nodes) {
  var that = this;
  nodes.forEach(function(n) {
    if (n.type == 'bulb') {
      if (n.cmdBinaryState && (n.binaryState !== n.cmdBinaryState)) {
        that.setBulbBinaryState(n.deviceId, n.cmdBinaryState);
      }
      if (n.cmdBrightness && (n.brightness !== n.cmdBrightness)) {
        that.setBulbBrightness(n.deviceId, n.cmdBrightness);
      }
    }
  }) 
}

