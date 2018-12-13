const express = require('express');
const url = require('url');
const fs = require('fs');
const path = require('path');

const Config = require('./config.json');

console.log('Map file path ' + Config.mapDataFilePath);


const port = process.argv[2] || Config.port;
const filePath = Config.mapDataFilePath;

const app = express();

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


app.listen(port)
console.log("server started on port " + port);


/*
// https://stackoverflow.com/questions/13698043/observe-file-changes-with-node-js
fs.watch('somedir', function (event, filename) {
    console.log('event is: ' + event);
    if (filename) {
        console.log('filename provided: ' + filename);
    } else {
        console.log('filename not provided');
    }
});
*/