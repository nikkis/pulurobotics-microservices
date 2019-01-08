const Config = require('./config.json');
const port = process.argv[2] || Config.port;

const MapServer = require('./MapServer');

const express = require('express');
const app = express();
const socketio = require('socket.io');

const server = app.listen(port);
console.log("HTTP server started on port " + port);

const io = socketio.listen(server);
console.log("Socket.io server started on port " + port);

const mapServer = new MapServer(io);

app.get('/', (req, res) => mapServer.getAllMapFiles(req, res));
app.get('/images/:mapPageId.png', (req, res) => mapServer.getMapPageImage(req, res));
app.get('/cleaningPath', (req, res) => mapServer.getCleaningPath(req, res));


io.on('connection', function (socket) {
  console.log('Client connected', socket.id)
  socket.on('disconnect', function () { console.log('Client disconnected', socket.id); });
});






