# Adison Gateway

## What is it?

Adison Gateway is a nodejs app that provides a link between the [Adison Cloud](https://github.com/AdisonTech/adison-cloud) web application, and IOT nodes.  It should run on most modern embedded linux devices (Raspberry PI, UDOO, etc) and personal computers (Linux, windows, MAC) -- basically anything that runs nodejs.

## Installation

* set up [Adison Cloud](https://github.com/AdisonTech/adison-cloud)
* [install](https://nodejs.org) nodejs
* git clone https://github.com/AdisonTech/adison-gateway.git or download [zip](https://github.com/AdisonTech/adison-gateway/archive/master.zip) archive.
* cd adison-gateway
* npm install
* cp config.js.example config.js
* edit config.js as needed.  Defaults should work if cloud app is running on the same machine as the gateway.
* node app.js

After the gateway is started, your site should appear in the cloud UI.  If any Wemo devices are on your network, they should be displayed as well.

### Installing nodejs on Raspberry PI

The version of nodejs distributed in the raspbian is old, so install something more recent directly from nodejs.org:

* wget https://nodejs.org/dist/v4.1.1/node-v4.1.1-linux-armv7l.tar.gz
* tar -xzvf node-v4.1.1-linux-armv7l.tar.gz
* sudo chown -R $USER /usr/local
* ln -s /opt/node-v4.1.1-linux-armv7l/bin/node /usr/local/bin/
* ln -s /opt/node-v4.1.1-linux-armv7l/bin/npm /usr/local/bin/

## Status

Currently only Wemo Link and Insight nodes are supported.  See [Issues](https://github.com/AdisonTech/adison-gateway/issues) for status on features in progress.

Tested on Linux and Windows 7 with NodeJS 4.1 and Meteor 1.2.

## License 

MIT.  See the file named LICENSE.





