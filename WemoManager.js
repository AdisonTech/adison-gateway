
var Wemo = require('wemo-client');
var Promise = require('bluebird');
var util = require("util");
var events = require("events");
var merge = require('deepmerge');

// node is object of objects. Key is friendlyName
//  -- type (bridge, insight, bulb)
//  -- ip
//  -- deviceId

function translateType(deviceType) {
  if (/bridge/.exec(deviceType)) {
    return 'bridge';
  } else if (/insight/.exec(deviceType)) {
    return 'outlet';
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
  var self = this;
  this.nodes.forEach(function(n) {
    if (n.dirty) {
      n.dirty = false;
      self.emit('nodeUpdate', n);
    }
  });
  /*
  if (!this.updateNodeTimer) {
    var self = this;
    this.updateNodeTimer = setTimeout(function() {
      self.emit('nodesUpdate', self.nodes);
      this.updateNodeTimer = null;
    }, 1000);
  }
  */
}

WemoManager.prototype.getNode = function(deviceId) {
  if (devicdId in this.nodeIndex) {
    var i = this.nodeIndex[deviceId];
    return this.nodes[i];
  } else {
    console.log('Warning, getNode returning null', deviceId);
    return null;
  }
}

WemoManager.prototype.updateNode = function(deviceId, props) {
  if (deviceId in this.nodeIndex) {
    // merge into existing node
    props.dirty = true;
    var i = this.nodeIndex[deviceId];
    var node_ = merge(this.nodes[i], props);
    this.nodes[i] = node_;
  } else {
    // create a new node
    props.deviceId = deviceId;
    props.dirty = true;
    this.nodes.push(props);
    this.nodeIndex[deviceId] = this.nodes.length - 1;
  } 
}

WemoManager.prototype.discover = function() {
  console.log('Wemo discovery ...');
  var self = this;
  this.wemo.discover(function(deviceInfo) {
    var deviceId = deviceInfo.UDN;

    self.updateNode(deviceId, {
      friendlyName:deviceInfo.friendlyName,
      type:translateType(deviceInfo.deviceType),
      ip: deviceInfo.host,
      deviceId: deviceId
    });

    self.queueUpdateNodesEvent();

    // Get the client for the found device
    var client = self.wemo.client(deviceInfo);

    self.wemoClients[deviceId] = client;

    console.log('deviceType', deviceInfo.deviceType);

    if (deviceInfo.deviceType.search('Belkin:device:bridge') >= 0) {
      client.getEndDevices(function(err, end) {
        end.forEach(function(e) {
          console.log(e);
          var bright = e.internalState['10008'] ? 
            /(\d*):/.exec(e.internalState['10008'])[1]/255 : 0;
          var state = e.internalState['10006'] ? e.internalState['10006'] : '0';

          self.updateNode(e.deviceId, {
            friendlyName: e.friendlyName,
            type: 'bulb',
            deviceId: e.deviceId,
            inputs: {
              binaryState: state,
              brightness: bright
            },
            outputs: {
              binaryState: state,
              brightness: bright
            },
          });

          self.queueUpdateNodesEvent();
          self.wemoClients[e.deviceId] = client;
        });
      });
    }

    // Handle BinaryState events
    client.on('binaryState', function(value) {
      self.updateNode(deviceId,
        {
          inputs: {binaryState: value},
          outputs: {binaryState: value}
        });
      self.queueUpdateNodesEvent();
    });

    client.on('statusChange', function(dev, cap, value) {
      console.log('statusChange', dev, cap, value);
      if (cap === '10008') {
        var b = /(\d*):/.exec(value)[1]/255;
        self.updateNode(dev, 
          {
            inputs: {brightness:b},
            outputs: {brightness:b}
          });
        self.queueUpdateNodesEvent();
      } else if (cap === '10006') {
        self.updateNode(dev, 
          {
            inputs: {binaryState: value}, 
            outputs: {binaryState: value}
          });
        self.queueUpdateNodesEvent();
      }
    });
  });
}

WemoManager.prototype.setBulbBinaryState = function(devId, state) {
  if (devId in this.wemoClients) {
    console.log('setting bulb binary state' + devId + ' ' + state);
    this.wemoClients[devId].setDeviceStatus(devId, '10006', state);
  }
}


WemoManager.prototype.setBulbBrightness = function(devId, brightness) {
  if (devId in this.wemoClients) {
    console.log('setting ' + devId + ' ' + brightness*100 + '%');
    this.wemoClients[devId].setDeviceStatus(devId, '10008', brightness*255);
  }
}

WemoManager.prototype.setBinaryState = function(devId, state) {
  if (devId in this.wemoClients) {
    console.log('setting binary state ' + devId + ' ' + state);
    this.wemoClients[devId].setBinaryState(state === '0' ? 0 : 1);
  }
}

WemoManager.prototype.update = function(node) {
  if (!node || !node.outputs || !node.inputs)
    return;

  if (node.type == 'bulb') {
    if (node.outputs.binaryState && (node.inputs.binaryState !== node.outputs.binaryState)) {
      this.setBulbBinaryState(node.deviceId, node.outputs.binaryState);
    }
    if (node.outputs.brightness && (node.inputs.brightness !== node.outputs.brightness)) {
      this.setBulbBrightness(node.deviceId, node.outputs.brightness);
    }
  } else if (node.type == 'outlet') {
    if (node.outputs.binaryState && (node.inputs.binaryState !== node.outputs.binaryState)) {
      this.setBinaryState(node.deviceId, node.outputs.binaryState);
    }
  }
}

