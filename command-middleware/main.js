/**
* Middleware for Pulurobotics robot.
*/

const net = require("net");

const Msg = require("./binmsg.js");
const robot = require("./robot.js");
const Config = require("./config.json");

/* Initialize robot client and SocketIO server */

console.log(`Connecting to robot on ${Config.robotHost}:${Config.robotPort}`);
const robotSocket = net.createConnection(
    {host: Config.robotHost, port: Config.robotPort},
    () => {
	console.log(`Connected to robot on ${Config.robotHost}:${Config.robotPort}`);
    });

console.log(`Starting Socket.io server on port ${Config.socketIOPort}`);
const app = require("express")();
const server = require("http").Server(app);
const io = require("socket.io")(server);
server.listen(Config.socketIOPort);

/* Events for robot client socket */

robotSocket.on("ready", () => {
    console.log("Robot client socket is ready.");
});

const WANT_OPCODE = 0;
const WANT_LENGTH1 = 1;
const WANT_LENGTH2 = 2;
const WANT_DATA = 3;
var data_parser_state = WANT_OPCODE;
var opcode, data_length, target_buf_pos, buffer, tmpbuf;
robotSocket.on("data", (data) => {
    //console.debug("***********************")
    //console.debug("New data chunk received");
    //console.debug(data.toString("hex"));

    for (var i = 0; i < data.length; i++) {
	
	switch (data_parser_state) {
	case WANT_OPCODE:
	    //console.debug("parser: looking for opcode");
	    opcode = data.readUIntBE(i, 1);
	    data_parser_state = WANT_LENGTH1;
	    //console.debug(`parser: opcode ${opcode} found`);
	    break;
	    
	case WANT_LENGTH1:
	    //console.debug("parser: looking for 1st length byte");
	    tmpbuf = Buffer.alloc(2);
	    data.copy(tmpbuf, 0, i, i+1);
	    data_parser_state = WANT_LENGTH2;
	    break;
	    
	case WANT_LENGTH2:
	    //console.debug("parser: looking for 2nd length byte");
	    data.copy(tmpbuf, 1, i, i+1);
	    data_length = tmpbuf.readUIntBE(0, 2);
	    buffer = Buffer.alloc(data_length + 3);
	    data.copy(buffer, 0, 0, 3);
	    target_buf_pos = 3;
	    data_parser_state = WANT_DATA;
	    //console.debug(`parser: length is ${data_length}`);
	    break;
	    
	case WANT_DATA:
	    //console.debug("parser: looking for data");
	    data.copy(buffer, target_buf_pos, i, i+1);
	    target_buf_pos++;
	    //console.log(`target_buf_pos: ${target_buf_pos}, data_length: ${data_length}`);
	    if (target_buf_pos - 3 == data_length) {
		//console.debug("parser: end of data, message ready");
		//console.debug("parser: about to decode, message dump follows");
		//console.debug(buffer.toString("hex"));
		var message = Msg.decodeMessage(buffer);
		var {return_message, payload} = robot.processMessage(message);
		//console.log(`Robot gave us message ${return_message}`);
		if (return_message) {
		    // TODO: send robot update to UI via socketIO
		    //console.debug("Sending message to UI");
		    //console.debug(return_message);
		    //console.debug(payload);
		    io.sockets.emit(return_message, payload);
		}
		data_parser_state = WANT_OPCODE;
		break;
	    }
	    //console.debug("parser: more data expected");
	    break;
	}
    }
    //console.debug("Finished processing data chunk");
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

    socket.broadcast.emit("robot_status", robot.getStatus());

    socket.on("disconnect", () => {
	console.log(`SocketIO client id ${socket.id} disconnected.`);
    });

    socket.on("error", (error) => {
	console.log("SocketIO error:");
	console.log(error);
    });
});
