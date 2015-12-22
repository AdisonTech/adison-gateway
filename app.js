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

ddp.on('nodeUpdate', function(node) {
  console.log('ddp nodeUpdate', node);
  wemo.update(node);
});

wemo.on('nodeUpdate', function(node) {
  console.log('wemo nodeUpdate', node);
  ddp.sendNode(config.siteShortName, node);
});

ddp.connect()
.then(ddp.subscribe())
.then(function() {
  console.log('DDP subscribed');
  wemo.discover();
});



