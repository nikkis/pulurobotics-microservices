/**
* Middleware for Pulurobotics robot.
*/

const net = require("net");

const Msg = require("./binmsg.js");
const robot = require("./robot.js");
const Config = require("./config.json");

/* Middleware status object */
middleware_status = {
    robot_connection_active: false,
    connected_clients: 0,
}

/* Initialize robot client connection */

let robotSocket = net.Socket();
robot.socket = robotSocket;

/* Initialize Socket.IO server */

const app = require("express")();
const server = require("http").Server(app);
const io = require("socket.io")(server);

/* Events for robot client socket */

robotSocket.on("connect", () => {
    console.log(`Connected to robot on ${Config.robotHost}:${Config.robotPort}`);
});

robotSocket.on("ready", () => {
    console.log("Robot client socket is ready.");
    reconnect_timeout = 5000;
    middleware_status.robot_connection_active = true;
    io.sockets.emit("middleware_status", middleware_status);
});

const WANT_OPCODE1 = 0;
const WANT_OPCODE2 = 1;
const WANT_LENGTH1 = 2;
const WANT_LENGTH2 = 3;
const WANT_LENGTH3 = 4;
const WANT_DATA = 5;
var data_parser_state = WANT_OPCODE1;
var opcode, data_length, target_buf_pos, buffer, tmpbuf;
robotSocket.on("data", (data) => {
    //console.debug("***********************")
    //console.debug("New data chunk received");
    //console.debug(data.toString("hex"));

    for (var i = 0; i < data.length; i++) {
	
	switch (data_parser_state) {
	case WANT_OPCODE1:
	    //console.debug("parser: looking for 1st opcode byte");
	    tmpbuf = Buffer.alloc(2);
	    data.copy(tmpbuf, 0, i, i+1);
	    data_parser_state = WANT_OPCODE2;
	    break;

	case WANT_OPCODE2:
	    //console.debug("parser: looking for 2nd opcode byte");
	    data.copy(tmpbuf, 1, i, i+1);
	    opcode = tmpbuf.readUIntBE(0, 2);
	    data_parser_state = WANT_LENGTH1;
	    //console.debug(`parser: opcode ${opcode} found`);
	    break;
	    
	case WANT_LENGTH1:
	    //console.debug("parser: looking for 1st length byte");
	    tmpbuf = Buffer.alloc(3);
	    data.copy(tmpbuf, 0, i, i+1);
	    data_parser_state = WANT_LENGTH2;
	    break;

	case WANT_LENGTH2:
	    //console.debug("parser: looking for 2nd length byte");
	    data.copy(tmpbuf, 1, i, i+1);
	    data_parser_state = WANT_LENGTH3;
	    break;

	case WANT_LENGTH3:
	    //console.debug("parser: looking for 3rd length byte");
	    data.copy(tmpbuf, 2, i, i+1);
	    data_length = tmpbuf.readUIntBE(0, 3);
	    buffer = Buffer.alloc(data_length + 5);
	    buffer.writeUIntBE(opcode, 0, 2);
	    buffer.writeUIntBE(data_length, 2, 3);
	    target_buf_pos = 5;
	    data_parser_state = WANT_DATA;
	    //console.debug(`parser: length is ${data_length}`);
	    break;
	    
	case WANT_DATA:
	    //console.debug("parser: looking for data");
	    data.copy(buffer, target_buf_pos, i, i+1);
	    target_buf_pos++;
	    //console.debug(`target_buf_pos: ${target_buf_pos}, data_length: ${data_length}`);
	    if (target_buf_pos - 5 == data_length) {
		//console.debug("parser: end of data, message ready");
		//console.debug("parser: about to decode, message dump follows");
		//console.debug(buffer.toString("hex"));
		var message = Msg.decodeMessage(buffer);
		var {return_message, payload} = robot.processMessage(message);
		//console.debug(`Robot gave us message ${return_message}`);
		if (return_message) {
		    //console.debug("Sending message to UI");
		    //console.debug(return_message);
		    //console.debug(payload);
		    io.sockets.emit(return_message, payload);
		}
		data_parser_state = WANT_OPCODE1;
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

reconnect_timeout = 5000;
robotSocket.on("close", () => {
    console.log(`Robot client socket is closed, waiting ${reconnect_timeout/1000} s to reconnect.`);
    middleware_status.robot_connection_active = false;
    io.sockets.emit("middleware_status", middleware_status);

    setTimeout(() => {
	console.log("Reconnecting to robot.");
	robotSocket.connect({host: Config.robotHost, port: Config.robotPort});
    }, reconnect_timeout);

    reconnect_timeout *= 2;
    if (reconnect_timeout > 300000) {
	reconnect_timeout = 300000;
    }
});

robotSocket.on("error", () => {
    console.log("Robot client socket connection error.");
});

/* Start client connection to robot */

console.log(`Connecting to robot on ${Config.robotHost}:${Config.robotPort}`);
robotSocket.connect({host: Config.robotHost, port: Config.robotPort});

/* Events for SocketIO server */

let clientConnectionPool = {};

io.on("connection", (socket) => {
    console.log(`SocketIO client id ${socket.id} connected.`);

    clientConnectionPool[socket.id] = socket;
    middleware_status.connected_clients += 1;

    io.sockets.emit("robot_status", robot.getStatus());
    io.sockets.emit("middleware_status", middleware_status);

    socket.on("disconnect", () => {
	console.log(`SocketIO client id ${socket.id} disconnected.`);
	middleware_status.connected_clients -= 1;
	io.sockets.emit("middleware_status", middleware_status);
    });

    socket.on("error", (error) => {
	console.log("SocketIO error:");
	console.log(error);
    });

    socket.on("start_mapping", () => {
	console.log("Received start_mapping message");
	arg1 = robot.localization_2d ? 1 : 0;
	arg2 = robot.localization_3d ? 1 : 0;
	arg3 = robot.mapping_2d ? 1 : 0;
	arg4 = robot.mapping_3d ? 1 : 0;
	arg5 = robot.collision_mapping ? 1 : 0;
	arg6 = robot.motors_on ? 1 : 0;
	arg7 = 1;
	arg8 = robot.big_localization_area ? 1: 0;
	arg9 = robot.vacuum_on ? 1 : 0;
	arg10 = robot.reserved3 ? 1 : 0;
	arg11 = robot.reserved4 ? 1 : 0;
	arg12 = robot.reserved5 ? 1 : 0;
	arg13 = robot.reserved6 ? 1 : 0;
	arg14 = robot.reserved7 ? 1 : 0;
	arg15 = robot.reserved8 ? 1 : 0;
	arg16 = robot.reserved9 ? 1 : 0;
	var cmd = Msg.encodeMessage(Msg.TYPE_STATEVECT_SET, "BBBBBBBBBBBBBBBB", arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14, arg15, arg16);
	robotSocket.write(cmd);
	io.sockets.emit("command_received", {command: "start_mapping"});
    });

    socket.on("go_straight", (point, mode="forward") => {
	console.log(`Received go_straight message, x: ${point.x}, y: ${point.y}, mode: ${mode}`);
	var direction;
	if (mode == "forward") {
	    direction = 1;
	} else if (mode == "backward") {
	    direction = 0;
	} else {
	    // unknown mode, go forward
	    direction = 1;
	}
	var cmd = Msg.encodeMessage(Msg.TYPE_DEST, "iiB", point.x, point.y, direction);
	console.log("Sending command to robot:");
	console.log(cmd);
	robotSocket.write(cmd);

	io.sockets.emit("command_received", {command: "go_straight"});
    });

    socket.on("go", (point) => {
	console.log(`Received go message, x: ${point.x}, y: ${point.y}`);
	var cmd = Msg.encodeMessage(Msg.TYPE_ROUTE, "iiB", point.x, point.y, 0);
	robotSocket.write(cmd);
	io.sockets.emit("command_received", {command: "go"});
    });

    socket.on("go_list", (list) => {
	console.log("Received go_list message");
	console.log(list);

	if (list.length > 0) {
	    robot.waypoints = list;
	    const waypoint = robot.waypoints.shift();

	    console.log("Going to first waypoint:", waypoint);

	    var cmd = Msg.encodeMessage(Msg.TYPE_ROUTE, "iiB", waypoint.x, waypoint.y, 0);
	    robotSocket.write(cmd);
	}

	io.sockets.emit("command_received", {command: "go_list"});
    });

    socket.on("stop", () => {
	console.log("Received stop message");
	var cmd = Msg.encodeMessage(Msg.TYPE_MODE, "b", 8);
	robotSocket.write(cmd);
	io.sockets.emit("command_received", {command: "stop"});
    });

    socket.on("add_obstacle", (point) => {
	console.log("Received add_obstacle message, ", point);
	var cmd = Msg.encodeMessage(Msg.TYPE_ADDCONSTRAINT, "ii", point.x, point.y);
	robotSocket.write(cmd);
	io.sockets.emit("command_received", {command: "add_obstacle"});
    });

    socket.on("remove_obstacle", (point) => {
	console.log("Received remove_obstacle message, ", point);
	var cmd = Msg.encodeMessage(Msg.TYPE_ADDCONSTRAINT, "ii", point.x, point.y);
	robotSocket.write(cmd);
	io.sockets.emit("command_received", {command: "remove_obstacle"});
    });

    socket.on("set_vacuum", (mode) => {
	console.log("Received set_vacuum message:", mode);
	arg1 = robot.localization_2d ? 1 : 0;
	arg2 = robot.localization_3d ? 1 : 0;
	arg3 = robot.mapping_2d ? 1 : 0;
	arg4 = robot.mapping_3d ? 1 : 0;
	arg5 = robot.collision_mapping ? 1 : 0;
	arg6 = robot.motors_on ? 1 : 0;
	arg7 = robot.autonomous_exploration ? 1 : 0;
	arg8 = robot.big_localization_area ? 1: 0;
	arg9 = mode ? 1 : 0;
	arg10 = robot.reserved3 ? 1 : 0;
	arg11 = robot.reserved4 ? 1 : 0;
	arg12 = robot.reserved5 ? 1 : 0;
	arg13 = robot.reserved6 ? 1 : 0;
	arg14 = robot.reserved7 ? 1 : 0;
	arg15 = robot.reserved8 ? 1 : 0;
	arg16 = robot.reserved9 ? 1 : 0;
	var cmd = Msg.encodeMessage(Msg.TYPE_STATEVECT_SET, "BBBBBBBBBBBBBBBB", arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14, arg15, arg16);
	robotSocket.write(cmd);
	io.sockets.emit("command_received", {command: "set_vacuum"});
    });
});

/* Start Socket.io server */

console.log(`Starting Socket.io server on port ${Config.socketIOPort}`);
server.listen(Config.socketIOPort);
