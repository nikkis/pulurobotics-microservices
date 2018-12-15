/**
* Middleware for Pulurobotics robot.
*/

const net = require("net");
const express = require("express");
const app = express();
const socketio = require("socketio");

const Msg = require("./binmsg.js");
const Robot = require("./robot.js");
const Config = require("./config.json");

/* Initialize robot client and SocketIO server */

const robotSocket = net.createConnection(
    {host: Config.robotHost, port: Config.robotPort},
    () => {
	console.log(`Connected to robot on ${Config.robotHost}:${Config.robotPort}.`);
    });

console.log(`Starting Socket.io server on port ${Config.socketIOPort}`);
const server = app.listen(Config.websocketPort);
const io = socketio.listen(server);
console.log("Started.");

/* Events for robot client socket */

robotSocket.on("ready", () => {
    console.log("Robot client socket is ready.");
});

const WANT_OPCODE = 0;
const WANT_LENGTH1 = 1;
const WANT_LENGTH2 = 2;
const WANT_DATA = 3;
var data_parser_state = WANT_OPCODE;
var opcode, data_length, data_pos, buffer, tmpbuf;
robotSocket.on("data", (data) => {
    // console.debug("New data chunk received");

    for (var i = 0; i < data.length; i++) {
	
	switch (data_parser_state) {
	case WANT_OPCODE:
	    // console.debug("parser: looking for opcode");
	    opcode = data.readUIntBE(i, 1);
	    data_parser_state = WANT_LENGTH1;
	    break;
	    
	case WANT_LENGTH1:
	    // console.debug("parser: looking for 1st length byte");
	    tmpbuf = Buffer.alloc(2);
	    data.copy(tmpbuf, 0, i, i+1);
	    data_parser_state = WANT_LENGTH2;
	    break;
	    
	case WANT_LENGTH2:
	    // console.debug("parser: looking for 2nd length byte");
	    data.copy(tmpbuf, 1, i, i+1);
	    data_length = tmpbuf.readUIntBE(0, 2);
	    data_pos = 0;
	    buffer = Buffer.alloc(data_length + 3);
	    data.copy(buffer, 0, 0, 3);
	    data_parser_state = WANT_DATA;
	    break;
	    
	case WANT_DATA:
	    // console.debug("parser: looking for data");
	    data.copy(buffer, data_pos, i, i+1);
	    data_pos++;
	    if (data_pos == data_length) {
		var message = Msg.decodeMessage(buffer);
		robot.processMessage(message);
		// TODO: send robot update to UI via socketIO
		data_parser_state = WANT_OPCODE;
	    }
	    break;
	}
    }
    // console.debug("Finished processing data chunk");
});

robotSocket.on("end", () => {
    console.log("Robot is closing the connection.");
});

robotSocket.on("close", () => {
    console.log("Robot client socket is closed.");
});

/* Events for SocketIO server */

let clientConnectionPool = {};

io.on("connection", (socket) => {
    console.log(`SocketIO client id ${socket.id} connected.`);

    clientConnectionPool[socket.id] = socket;

    socket.on("disconnect", () => {
	console.log(`SocketIO client id ${socket.id} disconnected.`);
    });

    socket.on("error", (error) => {
	console.log("SocketIO error:");
	console.log(error);
    });
});
