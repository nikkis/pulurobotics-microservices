# Microservices for Pulurobotics platfroms

The reporisoty contains:
- Microservice for relaying commands to Pulurobot platfrom via TCP connection and Socket.IO
- Microservice for transmitting robot's state changes
- Microservice for observing map data and notifying changes in the map data
- Microservice for routing based on map data, and for notifying about new routes

Different version of Pulurobot version 1 has been tagged.

## Installation

To install the middleware on a Pulurobotics platform robot:

~~~~
cd $HOME
mkdir middleware
cd middleware
~~~~

Download Node.JS version 11 or newer for ARMv8 (https://nodejs.org/en/download/current/) and unpack it into the middleware directory.

Install the middleware and dependencies:

~~~~
export PATH="$PATH:/home/hrst/middleware/node-[VERSION]/bin"
cd $HOME/middleware
git clone https://github.com/TheSoftwareFactory/pulurobotics-microservices
cd pulurobotics-microservices/map-middleware
npm install -g
cd ../command-middleware
npm install -g
cd ../pathFinder
npm install -g
~~~~

Install the forever package:

~~~~
npm install -g forever
~~~~

Edit the start_middleware.sh script to set the path to the Node.JS bin folder.

Edit the configurations for command-middleware and map-middleware to correspond to the correct paths and IP addresses.

Arrange for start_middleware.sh to be run on boot (e.g. in /etc.rc.local).
