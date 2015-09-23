# Adison Gateway

## What is it?

Adison Gateway is a nodejs app that provides a link between the [Adison Cloud](https://github.com/AdisonTech/adison-cloud) web application, and IOT nodes.  It should run on most modern embedded linux devices (Raspberry PI, UDOO, etc) and personal computers (Linux, windows, MAC) -- basically anything that runs nodejs.

## Installation

* set up [Adison Cloud](https://github.com/AdisonTech/adison-cloud)
* [install](https://nodejs.org) nodejs
* git clone https://github.com/AdisonTech/adison-gateway.git
* npm install
* cd adison-gateway
* cp config.js.example config.js
* edit config.js as needed
* node app.js

After the gateway is started, you should the site appear in the cloud UI.

## Status

Currently only Wemo Link and Insight nodes are supported.  See [Issues](https://github.com/AdisonTech/adison-gateway/issues) for status on features in progress.

## License 

MIT.  See the file named LICENSE.





