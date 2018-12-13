const express = require('express');
const app = express();
const socketio = require('socket.io');


const url = require('url');
const fs = require('fs');
const path = require('path');

const Config = require('./config.json');

console.log('Map file path ' + Config.mapDataFilePath);


const port = process.argv[2] || Config.port;
const filePath = Config.mapDataFilePath;

// Initialize servers
const server = app.listen(port);
console.log("HTTP server started on port " + port);
const io = socketio.listen(server);
console.log("Socket.io server started on port " + port);

// sockets for sending notifications about the data change
let uiPool = {};

let mapFileNames = [];

app.get('/', function (req, res) {
  console.log('Getting list of files');
  let files = [];

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  fs.readdir(filePath, (err, files) => {
    try {
      console.log('files', files);
      files = files.filter(function (el) {
        return el.toLowerCase().indexOf('.map'.toLowerCase()) > -1;
      });
    } catch (error) {
      console.error(error);
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end("Dir " + filePath + " not found!");
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(files));
    return;
  });
});


app.get('/:mapPageId', function (req, res) {
  console.log('Getting a single map page');

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  let pathname = `${filePath}${req.params.mapPageId}`;

  fs.exists(pathname, function (exist) {
    if (!exist) {
      // if the file is not found, return 404
      res.statusCode = 404;
      res.end(`File ${pathname} not found!`);
      return;
    }


    fs.readFile(pathname, function (err, data) {
      if (err) {
        res.statusCode = 500;
        res.end(`Error getting the file: ${err}.`);
      } else {
        // if the file is found, set Content-type and send data
        res.setHeader('Content-type', 'text/plain');


        res.end(data);
      }
    });
  });

});



/*
function addObserver(filename) {
  const file = filePath + filename;
  fs.watchFile(file, (curr, prev) => {
    console.log('curr', curr);
    console.log(`the current mtime is: ${curr.mtime}`);
    console.log(`the previous mtime was: ${prev.mtime}`);
    notifyUI(filename);
  });
}

fs.readdir(filePath, (err, files) => {
  try {
    console.log('files', files);
    mapFileNames = files.filter(function (el) {
      return el.toLowerCase().indexOf('.map'.toLowerCase()) > -1;
    });

    console.log('mapFileNames', mapFileNames);

    for (let i = 0; i < mapFileNames.length; i++) {
      const filename = mapFileNames[i];
      // add observer
      addObserver(filename);
    }

  } catch (error) {
    console.error(error);
  }
});
*/


function notifyUI(filename) {
  console.log('Notifying UI about the changed map', filename);
  if(uiPool) {
    try {
      console.log('sending..');
      // Send to all instead of just one
      //uiPool[socket.id].emit('map_page_changed', filename);
      io.sockets.emit('map_page_changed', filename);
      console.log('sent!');
    } catch (error) {
      console.error(error);
    }
  }
}


fs.watch(filePath, function (event, filename) {
  console.log('event is: ' + event);
  if (filename && filename.includes('.map')) {
      console.log('Map file changed: ' + filename);
      notifyUI(filename);
  } else {
      console.log('Not map file');
  }
});

console.log('Watching map files', filePath);






io.on('connection', function(socket){
  
  console.log('a user connected', socket.id)

  uiPool[socket.id] = socket;

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

});
