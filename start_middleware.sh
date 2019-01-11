#!/bin/bash

export PATH="$PATH:/home/hrst/middleware/node-v11.6.0-linux-armv7l/bin"

# Start command middleware
cd /home/hrst/middleware/robot-ui-middleware/command-middleware
npm start

# Start map middleware
cd /home/hrst/middleware/robot-ui-middleware/map-middleware
npm start
