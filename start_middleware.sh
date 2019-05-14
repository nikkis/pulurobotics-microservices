#!/bin/bash

export PATH="$PATH:/home/hrst/middleware/node-v11.6.0-linux-armv7l/bin"

# Clean away old logs
forever cleanlogs

# Start command middleware
cd /home/hrst/middleware/pulurobotics-microservices/command-middleware
npm start

# Start map middleware
cd /home/hrst/middleware/pulurobotics-microservices/map-middleware
npm start
